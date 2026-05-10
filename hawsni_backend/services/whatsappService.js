const fetch = require('node-fetch');
const { supabaseAdmin: supabase } = require('../config/supabase');

class WhatsAppService {
    constructor() {
        this.token = process.env.WHATSAPP_TOKEN;
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        this.apiVersion = 'v20.0';
    }

    async sendOrderConfirmation(phone, customerName, order, items = []) {
        if (!this.phoneNumberId) {
            console.warn('⚠️ WHATSAPP_PHONE_NUMBER_ID is not configured. WhatsApp message skipped.');
            return;
        }

        // Clean phone number (must be in E.164 format without + for WhatsApp Cloud API)
        const cleanPhone = phone.replace(/\D/g, '');
        
        // Ensure Egyptian numbers have 2 prefix if not present (assuming primary market is Egypt)
        let finalPhone = cleanPhone;
        if (finalPhone.startsWith('01') && finalPhone.length === 11) {
            finalPhone = '2' + finalPhone;
        }

        // Extract products names and image
        let productsNames = 'مجموعة منتجات';
        let imageUrl = null;

        if (items && items.length > 0) {
            productsNames = items.map(item => item.name || item.product_name || 'منتج').join(' و ');
            if (productsNames.length > 100) productsNames = productsNames.substring(0, 97) + '...';

            const firstImg = items[0].image_url || items[0].imageUrl || items[0].image || (items[0].products && items[0].products.images ? items[0].products.images[0] : null);
            if (firstImg && typeof firstImg === 'string' && firstImg.startsWith('http')) {
                imageUrl = firstImg;
            }
        }

        const components = [
            {
                type: "body",
                parameters: [
                    { type: "text", text: customerName || "عميلنا العزيز" },
                    { type: "text", text: order.order_number || (order.id ? order.id.substring(0, 8) : "123456") },
                    { type: "text", text: order.total ? order.total.toString() : "0" },
                    { type: "text", text: productsNames }
                ]
            }
        ];

        if (imageUrl) {
            components.unshift({
                type: "header",
                parameters: [
                    {
                        type: "image",
                        image: { link: imageUrl }
                    }
                ]
            });
        }

        try {
            const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
            
            const payload = {
                messaging_product: "whatsapp",
                to: finalPhone,
                type: "template",
                template: {
                    name: "order_confirm", 
                    language: {
                        code: "ar"
                    },
                    components: components
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('❌ WhatsApp API Error:', result);
                throw new Error(result.error?.message || 'Failed to send WhatsApp message');
            }

            console.log(`✅ WhatsApp confirmation sent to ${finalPhone}`);
            return result;
        } catch (error) {
            console.error('❌ WhatsApp Service Error:', error.message);
        }
    }

    /**
     * Send a generic text message (Only works if customer contacted first within 24h)
     */
    async sendTextMessage(phone, message) {
        if (!this.phoneNumberId) return;

        const cleanPhone = phone.replace(/\D/g, '');
        let finalPhone = cleanPhone;
        if (finalPhone.startsWith('01') && finalPhone.length === 11) finalPhone = '2' + finalPhone;

        try {
            const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
            const payload = {
                messaging_product: "whatsapp",
                to: finalPhone,
                type: "text",
                text: { body: message }
            };

            await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error('❌ WhatsApp Text Error:', error.message);
        }
    }

    async handleWebhook(payload) {
        try {
            // Meta webhooks have this specific nested structure
            if (payload.object === 'whatsapp_business_account' && payload.entry && payload.entry[0]) {
                const changes = payload.entry[0].changes;
                if (changes && changes[0] && changes[0].value && changes[0].value.messages) {
                    const messages = changes[0].value.messages;
                    
                    for (let msg of messages) {
                        // Meta templates return buttons as type 'button'
                        if ((msg.type === 'interactive' && msg.interactive) || (msg.type === 'button' && msg.button)) {
                            const buttonReply = msg.interactive ? msg.interactive.button_reply : msg.button;
                            
                            // Check if the user clicked our "Cancel Order" button
                            const buttonId = buttonReply.id || buttonReply.payload;
                            const buttonText = buttonReply.title || buttonReply.text;

                            if (buttonId === 'cancel_order' || buttonId === 'إلغاء الطلب' || (buttonText && buttonText.includes('إلغاء'))) {
                                const phone = msg.from;
                                console.log(`[WhatsApp Webhook] 📲 User ${phone} requested order cancellation`);
                                
                                // Require orderService locally to prevent circular dependency
                                const orderService = require('./orderService');
                                
                                const order = await orderService.getLatestActiveOrderByPhone(phone);
                                
                                if (order) {
                                    console.log(`[WhatsApp Webhook] 🛑 Found order ${order.order_number}. Cancelling...`);
                                    await orderService.updateOrderStatus(order.id, 'Cancelled');
                                    
                                    // Send confirmation back to user
                                    await this.sendTextMessage(phone, "تم إلغاء طلبك بنجاح. نعتذر عن أي إزعاج ونتمنى خدمتك قريباً 🤍");
                                } else {
                                    console.log(`[WhatsApp Webhook] ⚠️ No active order found for ${phone}`);
                                    await this.sendTextMessage(phone, "عذراً، لم نتمكن من العثور على طلب نشط أو قيد التنفيذ مرتبط برقمك. ربما تم الإلغاء مسبقاً.");
                                }
                            } else if (buttonText === 'موافق') {
                                // Send Vodafone Cash details
                                await this.sendTextMessage(
                                    phone,
                                    "رائع! يرجى تحويل ديبوزت بقيمة 70 جنيه على رقم فودافون كاش: 01038588564 📱\n(تنبيه: برجاء إرسال صورة التحويل 'سكرين شوت' هنا في هذه المحادثة ليتم تأكيد طلبك فوراً)."
                                );
                            } else if (buttonText === 'الغاء' || buttonText === 'إلغاء') {
                                // Ask for cancellation reason
                                await this.sendTextMessage(
                                    phone,
                                    "نعتذر لسماع ذلك 😔. هل يمكنك إخبارنا بسبب عدم رغبتك في إكمال الطلب لمساعدتنا في تحسين خدماتنا؟"
                                );
                            } else if (buttonId === 'track_order' || buttonText === 'تتبع الطلب') {
                                // Existing tracking logic can be triggered here or send a message
                                await this.sendTextMessage(phone, "جاري الاستعلام عن حالة طلبك...");
                                // Actually, we can just trigger the tracking logic below if we refactored it,
                                // but for now a simple message is fine, or we can duplicate the tracking code.
                                const orderService = require('./orderService');
                                const activeOrder = await orderService.findActiveOrderByPhone(phone);
                                if (activeOrder) {
                                    const bostaService = require('./bostaService');
                                    if (activeOrder.tracking_number) {
                                        const trackingData = await bostaService.trackDelivery(activeOrder.tracking_number);
                                        const stateText = bostaService.translateDeliveryState(trackingData.state);
                                        await this.sendTextMessage(phone, `حالة طلبك رقم #${activeOrder.order_number}: ${stateText}`);
                                    } else {
                                        await this.sendTextMessage(phone, `طلبك رقم #${activeOrder.order_number} جاري تجهيزه ولم يتم تسليمه لشركة الشحن بعد.`);
                                    }
                                } else {
                                    await this.sendTextMessage(phone, "عذراً، لم نتمكن من العثور على طلب نشط مرتبط برقمك.");
                                }
                            } else if (buttonId === 'edit_order' || buttonText === 'تعديل الطلب') {
                                // Notify user that an admin will help
                                await this.sendTextMessage(phone, "لتعديل طلبك، سيقوم أحد ممثلي خدمة العملاء بالرد عليك حالاً. ⏳");
                                // Update session to human requested
                                await supabase.from('chat_sessions').update({ status: 'human_requested', updated_at: new Date().toISOString() }).eq('session_id', phone);
                            }
                        } else if (msg.type === 'image' && msg.image) {
                            const phone = msg.from;
                            const mediaId = msg.image.id;
                            
                            // 1. Save image to chat database
                            try {
                                const { data: session } = await supabase.from('chat_sessions').select('session_id').eq('session_id', phone).single();
                                if (!session) {
                                    await supabase.from('chat_sessions').insert([{ session_id: phone, status: 'human_requested' }]);
                                } else {
                                    await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString(), status: 'human_requested' }).eq('session_id', phone);
                                }
                                
                                await supabase.from('chat_messages').insert([{
                                    session_id: phone,
                                    sender_type: 'user',
                                    content: `[IMAGE:${mediaId}]`
                                }]);
                            } catch (dbError) {
                                console.error('[WhatsApp Webhook] ❌ Failed to save image to DB:', dbError);
                            }

                            // 2. Send interactive confirmation
                            const interactivePayload = {
                                messaging_product: "whatsapp",
                                to: phone,
                                type: "interactive",
                                interactive: {
                                    type: "button",
                                    body: {
                                        text: "شكراً لك! تم استلام صورة التحويل وجاري مراجعتها وتأكيد طلبك 🤍"
                                    },
                                    action: {
                                        buttons: [
                                            { type: "reply", reply: { id: "track_order", title: "تتبع الطلب" } },
                                            { type: "reply", reply: { id: "edit_order", title: "تعديل الطلب" } }
                                        ]
                                    }
                                }
                            };
                            
                            const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
                            await fetch(url, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${this.token}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(interactivePayload)
                            });
                        } else if (msg.type === 'text' && msg.text) {
                            const textBody = msg.text.body ? msg.text.body.trim() : '';
                            const phone = msg.from;
                            
                            // 🟢 SAVE TO CHAT DATABASE
                            try {
                                // 1. Ensure Session Exists
                                const { data: session } = await supabase
                                    .from('chat_sessions')
                                    .select('session_id')
                                    .eq('session_id', phone)
                                    .single();
                                    
                                if (!session) {
                                    await supabase.from('chat_sessions').insert([{
                                        session_id: phone,
                                        status: 'human_requested'
                                    }]);
                                } else {
                                    // Update timestamp
                                    await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('session_id', phone);
                                }
                                
                                // 2. Insert Message
                                await supabase.from('chat_messages').insert([{
                                    session_id: phone,
                                    sender_type: 'user',
                                    content: textBody
                                }]);
                            } catch (dbError) {
                                console.error('[WhatsApp Webhook] ❌ Failed to save message to DB:', dbError);
                            }

                            // Check if text contains "تتبع" or "track" (including common typos)
                            const lowerBody = textBody.toLowerCase();
                            if (lowerBody.includes('تتبع') || lowerBody.includes('تتعب') || lowerBody.includes('track')) {
                                console.log(`[WhatsApp Webhook] 🔍 User ${phone} requested order tracking`);
                                
                                const orderService = require('./orderService');
                                const order = await orderService.getLatestActiveOrderByPhone(phone);
                                
                                if (order) {
                                    // Translate internal status to user friendly Arabic
                                    const statusMap = {
                                        'Pending': 'قيد الانتظار لمراجعته',
                                        'Processing': 'قيد التجهيز في المخزن',
                                        'Confirmed': 'تم تأكيده وجاري تجهيزه للشحن',
                                        'Shipped': 'تم الشحن وهو في طريقه إليك'
                                    };
                                    const arStatus = statusMap[order.status] || order.status;
                                    
                                    if (order.tracking_number) {
                                        await this.sendTextMessage(phone, `أهلاً بك 🤍\nطلبك رقم #${order.order_number} تم تسليمه لشركة بوسطة للشحن.\n\nيمكنك تتبع خط سير الشحنة ومعرفة موعد وصولها مباشرة عبر هذا الرابط:\nhttps://bosta.co/ar-eg/tracking-shipments?shipment-number=${order.tracking_number}`);
                                    } else {
                                        await this.sendTextMessage(phone, `أهلاً بك 🤍\nطلبك رقم #${order.order_number} حالياً: *${arStatus}*.\n\nسنقوم بتسليمه لشركة الشحن قريباً وسنرسل لك رابط التتبع بمجرد شحنه.`);
                                    }
                                } else {
                                    await this.sendTextMessage(phone, "عذراً، لم نتمكن من العثور على طلبات نشطة مرتبطة برقمك الحالي. 🛒");
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error handling WhatsApp Webhook:', error);
        }
    }
}

module.exports = new WhatsAppService();
