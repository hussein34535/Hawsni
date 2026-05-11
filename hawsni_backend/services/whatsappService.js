const fetch = require('node-fetch');
const { supabaseAdmin: supabase } = require('../config/supabase');
const aiChatbotService = require('./aiChatbotService');

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

    // ─────────────────────────────────────────────
    //  AI SUPPORT HANDLER
    // ─────────────────────────────────────────────
    async _handleIncomingText(msg) {
        const textBody = (msg.text.body || '').trim();
        if (!textBody) return;
        const phone = msg.from;

        // 1. Get or create session
        let session = null;
        const { data: existing } = await supabase.from('chat_sessions').select('*').eq('session_id', phone).single();
        if (!existing) {
            const { data: ns } = await supabase.from('chat_sessions')
                .insert([{ session_id: phone, status: 'bot_active', platform: 'whatsapp' }])
                .select().single();
            session = ns;
        } else {
            await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString(), platform: 'whatsapp' }).eq('session_id', phone);
            session = existing;
        }

        // 2. Save user message to DB
        await supabase.from('chat_messages').insert([{ session_id: phone, sender_type: 'user', content: textBody }]);

        // 3. If admin took over → silence the bot
        if (session?.status === 'human_active') {
            console.log(`[WA] 🤝 Human active for ${phone}, skipping bot.`);
            return;
        }

        // 4. Let Gemini AI handle everything
        try {
            console.log(`[WA] 🤖 AI handling message from ${phone}: "${textBody}"`);

            const { data: history } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('session_id', phone)
                .order('created_at', { ascending: true })
                .limit(15);

            const formatted = (history || [])
                .filter(m => m.content?.trim())
                .map(m => ({ role: m.sender_type === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));

            // AI history must start with a user message
            while (formatted.length > 0 && formatted[0].role === 'model') formatted.shift();

            const aiResponse = await aiChatbotService.handleChat(textBody, formatted, phone, session?.summary || null);

            if (aiResponse?.reply) {
                await supabase.from('chat_messages').insert([{ session_id: phone, sender_type: 'bot', content: aiResponse.reply }]);
                await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('session_id', phone);
                await this.sendTextMessage(phone, aiResponse.reply);
                console.log(`[WA] ✅ AI replied to ${phone}`);
            }
        } catch (err) {
            console.error('[WA] ❌ AI failed:', err.message);
            await this.sendTextMessage(phone, 'شكراً لتواصلك مع هَوَسي 🤍\nسيرد عليك فريقنا في أقرب وقت ممكن!');
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
                            const phone = msg.from;
                            
                            // Check if the user clicked our "Cancel Order" button
                            const buttonId = buttonReply.id || buttonReply.payload;
                            const buttonText = buttonReply.title || buttonReply.text;

                            if (buttonId === 'cancel_order' || buttonId === 'إلغاء الطلب' || (buttonText && buttonText.includes('إلغاء'))) {
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
                            } else if (buttonId === 'confirm_order' || (buttonText && (buttonText.trim() === 'موافق' || buttonText.trim() === 'Confirm'))) {
                                // Send Vodafone Cash details + request sender number (softened)
                                await this.sendTextMessage(
                                    phone,
                                    "رائع! يرجى تحويل ديبوزيت بقيمة 70 جنيه على رقم فودافون كاش: 01038588564 📱\n\nتنبيه: برجاء إرسال صورة التحويل (سكرين شوت) ويفضل أيضاً ذكر رقم الموبايل الذي حولت منه لتسريع عملية التأكيد. 🤍"
                                );
                            } else if (buttonText === 'الغاء' || buttonText === 'إلغاء') {
                                // Ask for cancellation reason
                                await this.sendTextMessage(
                                    phone,
                                    "نعتذر لسماع ذلك 😔. هل يمكنك إخبارنا بسبب عدم رغبتك في إكمال الطلب لمساعدتنا في تحسين خدماتنا؟"
                                );
                            } else if (buttonId === 'track_order' || buttonText === 'تتبع الطلب') {
                                // Send direct tracking link
                                await this.sendTextMessage(phone, "يمكنك تتبع حالة طلبك وتفاصيله مباشرة عبر هذا الرابط: 🚚\nhttps://hwasi.com/track-order");
                            } else if (buttonId === 'edit_order' || buttonText === 'تعديل الطلب') {
                                // Check order status before allowing edit
                                const orderService = require('./orderService');
                                const order = await orderService.getLatestActiveOrderByPhone(phone);
                                
                                if (order && (order.status === 'Shipped' || order.status === 'Delivered')) {
                                    await this.sendTextMessage(phone, `عذراً، طلبك رقم #${order.order_number} تم تسليمه بالفعل لشركة الشحن وهو الآن في طريقه إليك، لذا لا يمكن تعديله في هذه المرحلة. 🚚`);
                                } else {
                                    // Send direct support link for editing
                                    await this.sendTextMessage(phone, "لتعديل طلبك، يمكنك التواصل معنا مباشرة عبر هذا الرابط وسنقوم بمساعدتك فوراً: 💬\nhttps://wa.me/201038588564");
                                    // Also update session to human requested so admin sees it in dashboard
                                    await supabase.from('chat_sessions').update({ status: 'human_requested', updated_at: new Date().toISOString() }).eq('session_id', phone);
                                }
                            }


                        } else if (msg.type === 'image' && msg.image) {
                            const phone = msg.from;
                            const mediaId = msg.image.id;
                            
                            // 🟢 SAVE TO CHAT DATABASE
                            try {
                                const { data: session } = await supabase.from('chat_sessions').select('session_id').eq('session_id', phone).single();
                                if (!session) {
                                    await supabase.from('chat_sessions').insert([{ 
                                        session_id: phone, 
                                        status: 'human_requested',
                                        platform: 'whatsapp'
                                    }]);
                                } else {
                                    await supabase.from('chat_sessions').update({ 
                                        updated_at: new Date().toISOString(),
                                        platform: 'whatsapp'
                                    }).eq('session_id', phone);
                                }
                                await supabase.from('chat_messages').insert([{ session_id: phone, sender_type: 'user', content: `[IMAGE:${mediaId}]` }]);
                            } catch (dbError) {
                                console.error('[WhatsApp Webhook] ❌ Failed to save image to DB:', dbError);
                            }

                            // 2. Send confirmation with links
                            const linksMsg = "شكراً لك! تم استلام صورة التحويل وجاري مراجعتها وتأكيد طلبك 🤍\n\n" +
                                             "🔗 تتبع الطلب:\nhttps://hwasi.com/track-order\n\n" +
                                             "🔗 تعديل الطلب:\nhttps://wa.me/201038588564";
                            
                            await this.sendTextMessage(phone, linksMsg);
                        } else if (msg.type === 'text' && msg.text) {
                            await this._handleIncomingText(msg);
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
