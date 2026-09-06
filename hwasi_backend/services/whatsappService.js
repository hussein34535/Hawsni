const fetch = require('node-fetch');
const { supabaseAdmin: supabase } = require('../config/supabase');
const aiChatbotService = require('./aiChatbotService');

function normalizeApprovalText(value) {
    return String(value || '')
        .normalize('NFKC')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function isDepositApprovalClick(buttonId, rawText) {
    if (String(buttonId || '').trim().toLowerCase() === 'confirm_order') return true;
    const text = normalizeApprovalText(rawText);
    if (!text) return false;
    if (['موافق', 'اوافق', 'تاكيد', 'تم الدفع', 'ادفع', 'confirm', 'ok', 'okay', 'yes'].includes(text)) return true;
    return /(موافق|اوافق|تاكيد|الدفع|دفع|confirm)/.test(text);
}

class WhatsAppService {
    constructor() {
        this.token = process.env.WHATSAPP_TOKEN;
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        this.apiVersion = 'v20.0';
    }

    // Canonical Egyptian phone format for session IDs.
    // Meta webhooks send "201016270395" while some legacy rows use "01016270395".
    // Normalizing prevents the same customer from appearing as two sessions.
    normalizePhone(phone) {
        if (!phone) return phone;
        let p = String(phone).replace(/\D/g, '');
        if (p.startsWith('20') && p.length >= 12) return p;          // already canonical
        if (p.startsWith('0')) return '20' + p.substring(1);         // local 01x → 201x
        return p;
    }

    async _logMessage(sessionId, senderType, content, waMessageId = null) {
        try {
            // 1. Ensure session exists
            const { data: session, error: findErr } = await supabase.from('chat_sessions').select('session_id').eq('session_id', sessionId).maybeSingle();

            if (findErr) {
                console.error('[WA _logMessage] Find session error:', findErr);
            }

            if (!session) {
                const { error: insertErr } = await supabase.from('chat_sessions').upsert([{
                    session_id: sessionId,
                    status: 'bot_active',
                    platform: 'whatsapp',
                    updated_at: new Date().toISOString()
                }], { onConflict: 'session_id' });
                if (insertErr && insertErr.code !== '23505') {
                    console.error('[WA _logMessage] Insert session error:', insertErr);
                }
            } else {
                await supabase.from('chat_sessions')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('session_id', sessionId);
            }

            // 2. Insert message
            const msgData = {
                session_id: sessionId,
                sender_type: senderType,
                content: content
            };
            if (waMessageId) {
                msgData.wa_message_id = waMessageId;
                msgData.wa_status = 'sent';
            }
            const { data: inserted, error: msgErr } = await supabase.from('chat_messages').insert([msgData]).select('id').single();
            if (msgErr) {
                console.error('[WA _logMessage] Insert message error:', msgErr);
            }
            return inserted?.id || null;
        } catch (error) {
            console.error('❌ Failed to log message to DB:', error.message);
            return null;
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

        // Dynamic order identifier used by the template's URL buttons
        // ([0] تعديل الطلب / [1] تتبع الطلب). order_number is a 6-digit
        // code, safe to embed in a URL query param.
        const orderIdentifier = String(order.order_number || order.id || '');

        const bodyComponent = {
            type: "body",
            parameters: [
                { type: "text", text: customerName || "عميلنا العزيز" },
                { type: "text", text: order.order_number || (order.id ? order.id.substring(0, 8) : "123456") },
                { type: "text", text: order.total ? order.total.toString() : "0" },
                { type: "text", text: productsNames }
            ]
        };

        // URL button components. Each URL button owns its own {{1}} variable
        // (= the order identifier); numbering is independent of body {{1}}-{{4}}.
        const urlButtonComponents = [
            { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: orderIdentifier }] },
            { type: "button", sub_type: "url", index: "1", parameters: [{ type: "text", text: orderIdentifier }] }
        ];

        const templateUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
        const sendTemplatePayload = async (withButtons) => {
            const payload = {
                messaging_product: "whatsapp",
                to: finalPhone,
                type: "template",
                template: {
                    name: "order_confirm",
                    language: {
                        code: "ar"
                    },
                    components: withButtons ? [bodyComponent, ...urlButtonComponents] : [bodyComponent]
                }
            };

            const response = await fetch(templateUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            return { response, result };
        };

        const isParamMismatch = (result) =>
            result?.error?.code === 132000 ||
            /parameter/i.test(result?.error?.message || '');

        try {
            // 1) Try with URL buttons (works once the updated template is approved).
            let { response, result } = await sendTemplatePayload(true);

            // 2) If Meta rejects the button params (old template still live while
            //    the new one is under review), retry body-only so delivery continues.
            if (!response.ok && isParamMismatch(result)) {
                console.warn(`⚠️ order_confirm URL buttons rejected (template update may still be under review). Retrying body-only for ${finalPhone}...`);
                ({ response, result } = await sendTemplatePayload(false));
            }

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
     * Send a generic text message via WhatsApp Cloud API.
     * Only works within the 24h customer service window.
     * Falls back to the order_confirm template if the window is closed.
     * Returns { success, error } for callers to handle.
     */
    async sendTextMessage(phone, message) {
        if (!this.phoneNumberId) return { success: false, error: 'WHATSAPP_NOT_CONFIGURED' };

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
                const errCode = result?.error?.code;
                // 131026 / 131008 / 132001 = messaging window / template not allowed errors
                if (errCode === 131026 || errCode === 131008 || errCode === 132001 || errCode === 131005 || errCode === 131047) {
                    console.warn(`⚠️ 24h messaging window closed for ${finalPhone}, falling back to template...`);
                    return await this._sendAsTemplateFallback(phone, message);
                }
                console.error('❌ WhatsApp Text API Error:', result);
                return { success: false, error: result?.error?.message || 'WhatsApp API Error' };
            }

            // Save wamid for status tracking
            const wamid = result?.messages?.[0]?.id || null;
            return { success: true, wamid };
        } catch (error) {
            console.error('❌ WhatsApp Text Error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send an image message via WhatsApp Cloud API.
     * Only works within the 24h customer service window.
     * Returns { success, error } for callers to handle.
     */
    async sendImageMessage(phone, imageUrl, senderType = 'bot') {
        if (!this.phoneNumberId) return { success: false, error: 'WHATSAPP_NOT_CONFIGURED' };

        const cleanPhone = phone.replace(/\D/g, '');
        let finalPhone = cleanPhone;
        if (finalPhone.startsWith('01') && finalPhone.length === 11) finalPhone = '2' + finalPhone;

        try {
            const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
            const payload = {
                messaging_product: "whatsapp",
                to: finalPhone,
                type: "image",
                image: {
                    link: imageUrl
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
                const errCode = result?.error?.code;
                // If outside 24h window, images can't be sent as templates — report clearly
                if (errCode === 131026 || errCode === 131008 || errCode === 132001 || errCode === 131005 || errCode === 131047) {
                    console.warn(`⚠️ 24h messaging window closed for ${finalPhone}. Image cannot be sent.`);
                    return { success: false, error: 'خارج نافذة 24 ساعة — لا يمكن إرسال صور', windowClosed: true };
                }
                console.error('❌ WhatsApp Image API Error:', result);
                return { success: false, error: result?.error?.message || 'WhatsApp API Error' };
            }

            const wamid = result?.messages?.[0]?.id || null;
            return { success: true, wamid };
        } catch (error) {
            console.error('❌ WhatsApp Image Error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Notify the admin of a new deposit receipt.
     * Sends a TEXT message first (which always reaches the admin, opening the
     * conversation / 24h window), then attempts to send the receipt IMAGE.
     */
    async notifyAdminReceipt(customerPhone, receiptUrl, order) {
        const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || '01016270395';
        const orderNumber = order.order_number || String(order.id).substring(0, 6).toUpperCase();
        const customerName = order.shipping_address?.name || order.users?.name || 'عميل';
        const total = Number(order.total || 0).toLocaleString();

        // 1. Text first — always delivered (falls back to template if 24h window closed)
        const adminMsg = `💰 إيصال ديبوزت جديد — طلب #${orderNumber}\n👤 العميل: ${customerName}\n📱 هاتف: ${customerPhone}\n💰 الإجمالي: ${total} ج.م\n\n📸 صورة الإيصال: ${receiptUrl}\n\nراجع الطلب من اللوحة: https://hwasibackend.vercel.app/admin/orders`;
        const textResult = await this.sendTextMessage(adminPhone, adminMsg);

        // 2. Image — only delivered if the 24h window is open (admin replied within 24h)
        const imgResult = await this.sendImageMessage(adminPhone, receiptUrl, 'admin');

        if (imgResult.success) {
            console.log(`[WA] ✅ Receipt image sent to admin ${adminPhone}`);
        } else if (imgResult.windowClosed) {
            console.log(`[WA] ⏳ Admin window closed — text sent with image link. Admin must reply to open the window for future images.`);
        }

        return { textResult, imgResult };
    }

    /**
     * Fallback: Send a message using the order_confirm template when the 24h window is closed.
     * Tries to embed the admin message into the template body.
     */
    async _sendAsTemplateFallback(phone, message, orderRef = null) {
        const cleanPhone = phone.replace(/\D/g, '');
        let finalPhone = cleanPhone;
        if (finalPhone.startsWith('01') && finalPhone.length === 11) finalPhone = '2' + finalPhone;

        // Truncate the message to fit template parameters
        const shortMsg = message.length > 100 ? message.substring(0, 97) + '...' : message;

        // The order_confirm template carries URL buttons (تعديل/تتبع) whose
        // {{1}} variable is mandatory once approved. Fall back to a harmless
        // placeholder when no order reference is available.
        const buttonIdentifier = String(orderRef || '------');
        const fallbackBody = {
            type: "body",
            parameters: [
                { type: "text", text: "عميلنا العزيز" },
                { type: "text", text: "------" },
                { type: "text", text: "0" },
                { type: "text", text: shortMsg }
            ]
        };
        const fallbackButtons = [
            { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: buttonIdentifier }] },
            { type: "button", sub_type: "url", index: "1", parameters: [{ type: "text", text: buttonIdentifier }] }
        ];

        try {
            const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
            // order_confirm template parameters: customerName, orderNumber, total, products
            const buildPayload = (withButtons) => ({
                messaging_product: "whatsapp",
                to: finalPhone,
                type: "template",
                template: {
                    name: "order_confirm",
                    language: { code: "ar" },
                    components: withButtons ? [fallbackBody, ...fallbackButtons] : [fallbackBody]
                }
            });
            const postPayload = async (withButtons) => {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(buildPayload(withButtons))
                });
                return { response, result: await response.json() };
            };

            let { response, result } = await postPayload(true);
            const isParamMismatch = result?.error?.code === 132000 ||
                /parameter/i.test(result?.error?.message || '');
            if (!response.ok && isParamMismatch) {
                console.warn(`⚠️ order_confirm URL buttons rejected in fallback (template update may still be under review). Retrying body-only for ${finalPhone}...`);
                ({ response, result } = await postPayload(false));
            }

            if (!response.ok) {
                console.error('❌ WhatsApp Template Fallback Error:', result);
                return { success: false, error: result?.error?.message || 'Template fallback failed' };
            }

            console.log(`✅ WhatsApp template fallback sent to ${finalPhone}`);
            return { success: true, fallback: true };
        } catch (error) {
            console.error('❌ WhatsApp Template Fallback Error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send the hwasi_order template (12h reminder with Pay / Cancel buttons)
     */
    async sendHwasiOrderReminder(phone) {
        if (!this.phoneNumberId) return { success: false, error: 'WHATSAPP_NOT_CONFIGURED' };

        const cleanPhone = phone.replace(/\D/g, '');
        let finalPhone = cleanPhone;
        if (finalPhone.startsWith('01') && finalPhone.length === 11) finalPhone = '2' + finalPhone;

        try {
            const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
            const payload = {
                messaging_product: "whatsapp",
                to: finalPhone,
                type: "template",
                template: {
                    name: "hwasi_order",
                    language: { code: "ar" }
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
                console.error('❌ WhatsApp hwasi_order Error:', result);
                return { success: false, error: result?.error?.message || 'Failed to send hwasi_order' };
            }

            await this._logMessage(phone, 'bot', `[TEMPLATE:hwasi_order] تم إرسال تذكير الدفع للعميل.`);
            console.log(`✅ WhatsApp hwasi_order reminder sent to ${finalPhone}`);
            return { success: true };
        } catch (error) {
            console.error('❌ WhatsApp hwasi_order Error:', error.message);
            return { success: false, error: error.message };
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
    //  NOTIFICATION: Email admin on first unread message only
    // ─────────────────────────────────────────────
    async _notifyAdminOnFirstMessage(phone, message, type = 'text') {
        try {
            // Count existing unread user messages for this session (before logging new one)
            const { count, error } = await supabase
                .from('chat_messages')
                .select('id', { count: 'exact', head: true })
                .eq('session_id', phone)
                .eq('sender_type', 'user')
                .not('is_read', 'eq', true);

            // If no unread messages exist, this is the first → send email
            if (!error && (count === 0 || count === null)) {
                const emailService = require('./emailService');
                await emailService.sendNewChatNotification(phone, message, type);
                console.log(`[WA] 📧 Email notification sent for ${phone}`);
            }
        } catch (err) {
            console.error('[WA] ❌ Email notification error:', err.message);
        }
    }

    // ─────────────────────────────────────────────
    //  AI SUPPORT HANDLER
    // ─────────────────────────────────────────────
    async _handleIncomingText(msg) {
        const textBody = (msg.text.body || '').trim();
        if (!textBody) return;
        const phone = this.normalizePhone(msg.from);

        // 1. Check if this is the first unread message → notify admin via email
        await this._notifyAdminOnFirstMessage(phone, textBody, 'text');

        // 2. Log user message and ensure session exists
        await this._logMessage(phone, 'user', textBody);

        // 2. Get session to check status
        const { data: session } = await supabase.from('chat_sessions').select('status, summary').eq('session_id', phone).single();

        // 3. If admin took over → silence the bot
        if (session?.status === 'human_active') {
            console.log(`[WA] 🤝 Human active for ${phone}, skipping bot.`);
            return;
        }

        // 4. AI Handling (DISABLED BY USER REQUEST)
        /*
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
                // sendTextMessage already calls _logMessage which handles DB logging and session timestamps
                await this.sendTextMessage(phone, aiResponse.reply);
                console.log(`[WA] ✅ AI replied to ${phone}`);
            }
        } catch (err) {
            console.error('[WA] ❌ AI failed:', err.message);
            await this.sendTextMessage(phone, 'شكراً لتواصلك مع هَوَسي 🤍\nسيرد عليك فريقنا في أقرب وقت ممكن!');
        }
        */
        
        // Instead of AI, we can just notify the admin or leave it for manual response
        console.log(`[WA] 📲 Message from ${phone} received (AI Disabled).`);
    }

    async _handleImageMessage(msg) {
        const phone = this.normalizePhone(msg.from);
        const mediaId = msg.image.id;

        // Notify admin (first unread message)
        await this._notifyAdminOnFirstMessage(phone, '[IMAGE] صورة واردة', 'image');

        // 1. Download image from WhatsApp & upload to Cloudinary for permanent storage
        let imageUrl = null;
        try {
            const mediaResponse = await fetch(`https://graph.facebook.com/${this.apiVersion}/${mediaId}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const mediaData = await mediaResponse.json();
            if (mediaData.url) {
                const imageRes = await fetch(mediaData.url, {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
                const buffer = await imageRes.buffer();
                const uploadToCloudinary = require('../utils/fileUpload');
                const result = await uploadToCloudinary({ buffer, originalname: `${mediaId}.jpg`, mimetype: 'image/jpeg' }, 'chat_media');
                imageUrl = result.url;
            }
        } catch (uploadErr) {
            console.error('[WA] Failed to upload image to Cloudinary:', uploadErr.message);
        }

        // 2. Log to DB with permanent URL
        const content = imageUrl ? `[IMAGE_URL:${imageUrl}]` : `[IMAGE:${mediaId}]`;
        await this._logMessage(phone, 'user', content);

        // Deposit-receipt linking is temporarily disabled. Inbound images are
        // kept in the chat transcript only; they are not attached to orders.
        await supabase.from('chat_sessions').update({ status: 'human_requested', updated_at: new Date().toISOString() }).eq('session_id', phone);
        console.log(`[WA] 🖼️ Image received from ${phone}; automatic deposit-receipt handling is temporarily disabled.`);
    }

    async _processWhatsAppMedia(mediaId, bucket) {
        try {
            const response = await fetch(`https://graph.facebook.com/${this.apiVersion}/${mediaId}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const mediaData = await response.json();
            const mediaUrl = mediaData.url;

            if (!mediaUrl) return null;

            const mediaRes = await fetch(mediaUrl, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const buffer = await mediaRes.buffer();

            const fileName = `${mediaId}_${Date.now()}.jpg`;

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, buffer, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            console.error("Error processing WhatsApp media:", error);
            return null;
        }
    }

    // ─────────────────────────────────────────────
    //  Handle message status updates (sent/delivered/read/failed)
    // ─────────────────────────────────────────────
    async _handleStatusUpdate(status) {
        try {
            const wamid = status.id;
            const newStatus = status.status; // sent, delivered, read, failed
            if (!wamid || !newStatus) return;

            // Map WhatsApp statuses to our statuses
            // 'sent' = ✓, 'delivered' = ✓✓ (grey), 'read' = ✓✓ (blue), 'failed' = ✗
            const { error } = await supabase
                .from('chat_messages')
                .update({ wa_status: newStatus })
                .eq('wa_message_id', wamid);

            if (error && !error.message?.includes('column')) {
                console.error('[WA Status] DB update error:', error);
            } else {
                console.log(`[WA Status] Message ${wamid} → ${newStatus}`);
            }
        } catch (err) {
            console.error('[WA Status] Error handling status:', err.message);
        }
    }

    async handleWebhook(payload) {
        try {
            // Meta webhooks have this specific nested structure
            if (payload.object === 'whatsapp_business_account' && payload.entry && payload.entry[0]) {
                const changes = payload.entry[0].changes;
                
                // Handle status updates (delivery receipts)
                if (changes && changes[0] && changes[0].value && changes[0].value.statuses) {
                    const statuses = changes[0].value.statuses;
                    for (const status of statuses) {
                        await this._handleStatusUpdate(status);
                    }
                }

                if (changes && changes[0] && changes[0].value && changes[0].value.messages) {
                    const messages = changes[0].value.messages;
                    
                    for (let msg of messages) {
                        // Meta templates return buttons as type 'button'
                        if ((msg.type === 'interactive' && msg.interactive) || (msg.type === 'button' && msg.button)) {
                            const buttonReply = msg.interactive ? msg.interactive.button_reply : msg.button;
                            const phone = this.normalizePhone(msg.from);
                            
                            // Log user click
                            const clickTitle = buttonReply.title || buttonReply.text || 'زر غير معروف';
                            await this._logMessage(phone, 'user', `[CLICKED: ${clickTitle}]`);

                            // Notify admin (first unread message)
                            await this._notifyAdminOnFirstMessage(phone, `[نقر على زر: ${clickTitle}]`, 'button');
                            
                            // Check if the user clicked our "Cancel Order" button
                            const buttonId = buttonReply.id || buttonReply.payload;
                            const buttonText = clickTitle;

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
                            } else if (isDepositApprovalClick(buttonId, buttonText)) {
                                // Deposit flow is temporarily disabled: log the approval click
                                // and leave the conversation for manual follow-up.
                                console.log(`[WA] 📲 Approval click received from ${phone}; deposit auto-reply is temporarily disabled.`);
                            }

                        } else if (msg.type === 'image' && msg.image) {
                            await this._handleImageMessage(msg);
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
