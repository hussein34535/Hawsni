const fetch = require('node-fetch');
const { supabaseAdmin: supabase } = require('../config/supabase');
const aiChatbotService = require('./aiChatbotService');

class WhatsAppService {
    constructor() {
        this.token = process.env.WHATSAPP_TOKEN;
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        this.apiVersion = 'v20.0';
    }

    async _logMessage(sessionId, senderType, content) {
        try {
            await supabase.from('chat_messages').insert([{
                session_id: sessionId,
                sender_type: senderType,
                content: content
            }]);
            
            // Also update session updated_at
            await supabase.from('chat_sessions')
                .update({ updated_at: new Date().toISOString() })
                .eq('session_id', sessionId);
        } catch (error) {
            console.error('❌ Failed to log message to DB:', error.message);
        }
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
            
            // Log to chat messages
            await this._logMessage(phone, 'bot', `[TEMPLATE:order_confirm] تم إرسال تأكيد الطلب بنجاح للعميل.`);
            
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

            // Log outgoing message
            await this._logMessage(phone, 'bot', message);
        } catch (error) {
            console.error('❌ WhatsApp Text Error:', error.message);
        }
    }

    async sendUrlButtonMessage(phone, bodyText, buttonText, url) {
        if (!this.phoneNumberId) return;
        const cleanPhone = phone.replace(/\D/g, '');
        let finalPhone = cleanPhone;
        if (finalPhone.startsWith('01') && finalPhone.length === 11) finalPhone = '2' + finalPhone;

        try {
            const apiUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
            const payload = {
                messaging_product: "whatsapp",
                to: finalPhone,
                type: "interactive",
                interactive: {
                    type: "cta_url",
                    body: { text: bodyText },
                    action: {
                        name: "cta_url",
                        parameters: {
                            display_text: buttonText,
                            url: url
                        }
                    }
                }
            };

            await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            // Log outgoing message
            await this._logMessage(phone, 'bot', `${bodyText}\n\n[BUTTON: ${buttonText}]`);
        } catch (error) {
            console.error('❌ WhatsApp CTA Error:', error.message);
        }
    }

    async sendInteractiveButtons(phone, bodyText, buttons) {
        if (!this.phoneNumberId) return;
        const cleanPhone = phone.replace(/\D/g, '');
        let finalPhone = cleanPhone;
        if (finalPhone.startsWith('01') && finalPhone.length === 11) finalPhone = '2' + finalPhone;

        try {
            const apiUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
            const payload = {
                messaging_product: "whatsapp",
                to: finalPhone,
                type: "interactive",
                interactive: {
                    type: "button",
                    body: { text: bodyText },
                    action: {
                        buttons: buttons.map((btn, index) => ({
                            type: "reply",
                            reply: {
                                id: btn.id,
                                title: btn.title
                            }
                        }))
                    }
                }
            };

            await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            // Log outgoing choices
            const btnTitles = buttons.map(b => b.title).join(' | ');
            await this._logMessage(phone, 'bot', `${bodyText}\n\n[CHOICES: ${btnTitles}]`);
        } catch (error) {
            console.error('❌ WhatsApp Buttons Error:', error.message);
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
                            
                            // Log user click
                            const clickTitle = buttonReply.title || buttonReply.text || 'زر غير معروف';
                            await this._logMessage(phone, 'user', `[CLICKED: ${clickTitle}]`);
                            
                            // Check if the user clicked our "Cancel Order" button
                            const buttonId = buttonReply.id || buttonReply.payload;
                            const buttonText = buttonReply.title || buttonReply.text;

                            if (buttonId === 'cancel_order' || (buttonText && (buttonText.includes('إلغاء') || buttonText.includes('الغاء')))) {
                                console.log(`[WhatsApp Webhook] 📲 User ${phone} requested order cancellation`);
                                const orderService = require('./orderService');
                                const order = await orderService.getLatestActiveOrderByPhone(phone);
                                
                                if (order) {
                                    await orderService.updateOrderStatus(order.id, 'Cancelled');
                                    await this.sendTextMessage(phone, "تم إلغاء طلبك بنجاح. نعتذر عن أي إزعاج ونتمنى خدمتك قريباً 🤍");
                                } else {
                                    await this.sendTextMessage(phone, "عذراً، لم نتمكن من العثور على طلب نشط أو قيد التنفيذ مرتبط برقمك.");
                                }
                            } else if (buttonId === 'track_order') {
                                const orderService = require('./orderService');
                                const order = await orderService.getLatestActiveOrderByPhone(phone);
                                const trackUrl = order ? `https://hwasi.com/track-order?order_number=${order.order_number}` : 'https://hwasi.com/track-order';
                                await this.sendUrlButtonMessage(phone, "إليك رابط تتبع طلبك 🚚", "فتح التتبع", trackUrl);
                            } else if (buttonId === 'edit_order') {
                                const orderService = require('./orderService');
                                const order = await orderService.getLatestActiveOrderByPhone(phone);
                                
                                if (order && (order.status === 'Shipped' || order.status === 'Delivered')) {
                                    await this.sendTextMessage(phone, `عذراً، طلبك رقم #${order.order_number} تم تسليمه بالفعل لشركة الشحن ولا يمكن تعديله الآن. 🚚`);
                                } else {
                                    const editUrl = order ? `https://hwasi.com/edit-order?order_number=${order.order_number}` : 'https://hwasi.com/edit-order';
                                    await this.sendUrlButtonMessage(phone, "يمكنك تعديل بيانات التوصيل من هنا 📝", "تعديل الطلب", editUrl);
                                    await supabase.from('chat_sessions').update({ status: 'human_requested', updated_at: new Date().toISOString() }).eq('session_id', phone);
                                }
                            } else if (buttonId === 'confirm_order' || (buttonText && (buttonText.trim() === 'موافق' || buttonText.trim() === 'Confirm'))) {
                                await this.sendTextMessage(
                                    phone,
                                    "رائع! يرجى تحويل ديبوزيت بقيمة 70 جنيه على رقم فودافون كاش: 01038588564 📱\n\nتنبيه: يرجى إرسال صورة عملية التحويل هنا لتأكيد طلبك. 🤍"
                                );
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

                            // 2. Send confirmation with ONE message containing TWO buttons
                            await this.sendInteractiveButtons(
                                phone,
                                "شكراً لك! تم استلام صورة التحويل وجاري مراجعتها وتأكيد طلبك 🤍\n\nماذا تريد أن تفعل الآن؟",
                                [
                                    { id: 'track_order', title: 'تتبع الطلب 🚚' },
                                    { id: 'edit_order', title: 'تعديل الطلب 📝' }
                                ]
                            );
                            
                            // Update session status
                            await supabase.from('chat_sessions').update({ status: 'human_requested', updated_at: new Date().toISOString() }).eq('session_id', phone);
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
