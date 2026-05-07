const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');

// POST /api/webhooks/bosta
router.post('/bosta', async (req, res) => {
    try {
        // --- Security Check ---
        const webhookSecret = process.env.BOSTA_WEBHOOK_SECRET;
        if (webhookSecret) {
            const authHeader = req.headers['authorization'];
            if (!authHeader || authHeader !== `${webhookSecret}` && authHeader !== `Bearer ${webhookSecret}`) {
                console.warn('[Bosta Webhook] 🚨 Unauthorized attempt from:', req.ip);
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
        } else {
            console.warn('[Bosta Webhook] ⚠️ WARNING: BOSTA_WEBHOOK_SECRET is not set! Webhook is vulnerable.');
        }

        console.log('[Bosta Webhook] Raw headers:', JSON.stringify(req.headers));
        console.log('[Bosta Webhook] Raw body:', JSON.stringify(req.body));
        
        // Bosta webhooks often wrap the payload in a 'data' object or send it flat
        const payload = req.body.data || req.body;
        const { deliveryId, trackingNumber, state } = payload;
        const actualDeliveryId = deliveryId || payload._id || payload.id;
        
        if (!actualDeliveryId && !trackingNumber) {
            console.warn('[Bosta Webhook] ⚠️ Could not find delivery identifiers in payload');
            return res.status(400).json({ success: false, message: 'Missing identifiers' });
        }

        // We only care about state updates
        if (state && state.value) {
            const bostaState = state.value.toUpperCase();
            let hawsniStatus = null;
            
            // Map Bosta State to Hawsni Status
            // Bosta typical states: "Ticket created", "Pickup requested", "Picked up", "Delivered", "Returned to business", "Cancelled"
            if (bostaState.includes('DELIVERED')) {
                hawsniStatus = 'Delivered';
            } else if (bostaState.includes('PICKED UP') || bostaState.includes('IN TRANSIT') || bostaState.includes('PICKED_UP')) {
                hawsniStatus = 'Shipped'; // Use 'Shipped' instead of 'In Transit' to match typical Hawsni status
            } else if (bostaState.includes('CANCELLED') || bostaState.includes('RETURNED') || bostaState.includes('EXCEPTION')) {
                hawsniStatus = 'Cancelled';
            }

            if (hawsniStatus) {
                // Find order by Bosta ID or Tracking Number
                let query = supabase.from('orders').select('*, users(name, email)');
                
                if (actualDeliveryId) {
                    query = query.eq('bosta_id', actualDeliveryId);
                } else if (trackingNumber) {
                    query = query.eq('tracking_number', trackingNumber);
                }

                const { data: order, error } = await query.single();

                if (order) {
                    // Only update if the status changed
                    if (order.status !== hawsniStatus) {
                        const { error: updateError } = await supabase
                            .from('orders')
                            .update({ status: hawsniStatus })
                            .eq('id', order.id);

                        if (!updateError) {
                            console.log(`[Bosta Webhook] Updated order ${order.order_number || order.id} to ${hawsniStatus}.`);
                            
                            // Try to extract phone and email
                            let customerEmail = order.users?.email;
                            let customerName = order.users?.name;
                            let customerPhone = null;

                            let ship = order.shipping_address;
                            if (typeof ship === 'string' && ship.trim().startsWith('{')) {
                                try { ship = JSON.parse(ship); } catch (e) { }
                            }
                            if (typeof ship === 'object' && ship !== null) {
                                customerEmail = customerEmail || ship.email || ship.guestEmail;
                                customerName = customerName || ship.name || ship.guestName;
                                customerPhone = ship.phone || ship.guestPhone;
                            }

                            // Send Email Notification
                            if (customerEmail) {
                                emailService.sendOrderStatusEmail(
                                    customerEmail,
                                    customerName || 'عميلنا العزيز',
                                    order,
                                    hawsniStatus
                                ).catch(err => console.error('[Bosta Webhook] Failed to send status email:', err));
                            }

                            // Send WhatsApp Notification
                            if (customerPhone && whatsappService) {
                                let whatsappMsg = '';
                                if (hawsniStatus === 'Shipped') {
                                    const trackingUrl = `https://hwasi.com/track-order?id=${order.id}`;
                                    whatsappMsg = `أهلاً ${customerName || 'عميلنا العزيز'} 👋\n\nنبشرك أن طلبك رقم #${order.order_number || order.id.substring(0,8)} تم تسليمه لشركة الشحن وهو الآن في طريقه إليك! 🚚\n\nيمكنك تتبع حالة طلبك مباشرة من هنا:\n${trackingUrl}\n\nشكراً لتسوقك من Hawsni 🤍`;
                                } else if (hawsniStatus === 'Delivered') {
                                    whatsappMsg = `أهلاً ${customerName || 'عميلنا العزيز'} 👋\n\nتم توصيل طلبك رقم #${order.order_number || order.id} بنجاح! 🎉\nنتمنى أن ينال إعجابك، ونسعد دائماً بخدمتك في Hawsni 🤍`;
                                } else if (hawsniStatus === 'Cancelled') {
                                    whatsappMsg = `أهلاً ${customerName || 'عميلنا العزيز'} 👋\n\nتم تحديث حالة طلبك رقم #${order.order_number || order.id} إلى (مرتجع / ملغي).\nإذا كان لديك أي استفسار، يرجى التواصل معنا 🤍`;
                                }

                                if (whatsappMsg) {
                                    whatsappService.sendTextMessage(customerPhone, whatsappMsg)
                                        .then(() => console.log(`[Bosta Webhook] Sent WhatsApp notification to ${customerPhone}`))
                                        .catch(err => console.error('[Bosta Webhook] Failed to send WhatsApp message:', err));
                                }
                            }
                        }
                    }
                } else {
                    console.log(`[Bosta Webhook] Order not found for Delivery ID: ${actualDeliveryId}, Tracking #: ${trackingNumber}`);
                }
            }
        }

        // Always reply 200 to Bosta so they don't retry unnecessarily
        res.status(200).send('OK');
    } catch (err) {
        console.error('[Bosta Webhook] Error processing:', err);
        // Important: Return 200 even on expected errors, or 500 if you want Bosta to retry
        res.status(500).send('Internal Server Error');
    }
});

// ==========================================
// Meta WhatsApp Webhook Integration
// ==========================================

// GET /api/webhooks/whatsapp (Meta Verification)
router.get('/whatsapp', (req, res) => {
    // Meta sends hub.mode, hub.challenge, and hub.verify_token
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (mode && token) {
        if (mode === 'subscribe' && token === verifyToken) {
            console.log('[WhatsApp Webhook] 🟢 Verified successfully!');
            // Meta expects a plain text response with the challenge code
            res.status(200).send(challenge);
        } else {
            console.warn('[WhatsApp Webhook] 🔴 Verification failed (Token mismatch)');
            res.status(403).send('Forbidden');
        }
    } else {
        res.status(400).send('Bad Request');
    }
});

// POST /api/webhooks/whatsapp (Message/Event Reception)
router.post('/whatsapp', async (req, res) => {
    try {
        console.log('[WhatsApp Webhook] 📩 Received event payload:');
        console.log(JSON.stringify(req.body, null, 2));
        
        // Pass the payload to the service to process
        await whatsappService.handleWebhook(req.body);
        
        // Always respond with 200 OK to Meta so they don't retry unnecessarily
        res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
        console.error('[WhatsApp Webhook] ❌ Error processing event:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
