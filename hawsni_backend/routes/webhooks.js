const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const emailService = require('../services/emailService');

// POST /api/webhooks/bosta
router.post('/bosta', async (req, res) => {
    try {
        console.log('[Bosta Webhook] Received event:', req.body);
        
        // Example Bosta payload: { deliveryId: '', trackingNumber: '', state: { value: 'DELIVERED', code: 45 } }
        // The structure may differ slightly based on Bosta API version, but these are typical fields.
        const { deliveryId, trackingNumber, state, type } = req.body;
        
        // We must have something to identify the order
        if (!deliveryId && !trackingNumber) {
            return res.status(400).json({ success: false, message: 'Missing identifiers' });
        }

        // We only care about state updates, or maybe others
        if (state && state.value) {
            const bostaState = state.value.toUpperCase();
            let hawsniStatus = null;
            
            // Map Bosta State to Hawsni Status
            // Bosta typical states: CREATED, PICKED_UP, DELIVERED, RETURNED, CANCELLED
            if (bostaState === 'DELIVERED') {
                hawsniStatus = 'Delivered';
            } else if (bostaState === 'PICKED_UP' || bostaState === 'IN_TRANSIT') {
                hawsniStatus = 'In Transit';
            } else if (bostaState === 'CANCELLED' || bostaState === 'RETURNED') {
                hawsniStatus = 'Cancelled';
            }

            if (hawsniStatus) {
                // Find order by Bosta ID or Tracking Number
                let query = supabase.from('orders').select('*, users(name, email)');
                
                if (deliveryId) {
                    query = query.eq('bosta_id', deliveryId);
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
                            console.log(`[Bosta Webhook] Updated order ${order.order_number || order.id} to ${hawsniStatus}. Sending email...`);
                            
                            // Try to extract email
                            let customerEmail = order.users?.email;
                            let customerName = order.users?.name;

                            if (!customerEmail) {
                                let ship = order.shipping_address;
                                if (typeof ship === 'string' && ship.trim().startsWith('{')) {
                                    try { ship = JSON.parse(ship); } catch (e) { }
                                }
                                if (typeof ship === 'object' && ship !== null) {
                                    customerEmail = ship.email || ship.guestEmail;
                                    customerName = customerName || ship.name || ship.guestName;
                                }
                            }

                            if (customerEmail) {
                                emailService.sendOrderStatusEmail(
                                    customerEmail,
                                    customerName || 'عميلنا العزيز',
                                    order,
                                    hawsniStatus
                                ).catch(err => console.error('[Bosta Webhook] Failed to send status email:', err));
                            }
                        }
                    }
                } else {
                    console.log('[Bosta Webhook] Order not found for identifiers:', deliveryId, trackingNumber);
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

module.exports = router;
