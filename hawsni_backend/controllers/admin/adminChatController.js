const fetch = require('node-fetch');
const { supabaseAdmin: supabase } = require('../../config/supabase');
const whatsappService = require('../../services/whatsappService');

class AdminChatController {
    async renderChatInbox(req, res) {
        try {
            res.render('chat-inbox', {
                title: 'شات الدعم المباشر',
                page: 'chat',
                path: '/admin/chat',
                user: req.user,
                supabaseUrl: process.env.SUPABASE_URL,
                supabaseAnonKey: process.env.SUPABASE_ANON_KEY
            });
        } catch (error) {
            console.error('Error rendering chat inbox:', error);
            res.status(500).send('Internal Server Error');
        }
    }

    // ── 1. Admin takes over session ─────────────────────────────
    async takeOver(req, res) {
        try {
            const { sessionId } = req.body;
            if (!sessionId) return res.status(400).json({ success: false, error: 'Missing sessionId' });

            // Get session to know platform
            const { data: session } = await supabase
                .from('chat_sessions').select('platform').eq('session_id', sessionId).single();

            // Update status
            await supabase.from('chat_sessions')
                .update({ status: 'human_active', updated_at: new Date().toISOString() })
                .eq('session_id', sessionId);

            // Notify customer on WhatsApp
            if (session?.platform === 'whatsapp') {
                const notifyMsg = 'مرحباً 👋\nتم تحويلك لأحد ممثلي خدمة العملاء لدى هَوَسي.\nكيف يمكننا مساعدتك؟ 🤍';
                await whatsappService.sendTextMessage(sessionId, notifyMsg);
                await supabase.from('chat_messages').insert([{
                    session_id: sessionId, sender_type: 'bot', content: notifyMsg
                }]);
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Error in takeOver:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // ── 2. Send message (platform-aware) ────────────────────────
    async sendMessage(req, res) {
        try {
            const { sessionId, content } = req.body;
            if (!sessionId || !content) {
                return res.status(400).json({ success: false, error: 'Missing sessionId or content' });
            }

            // Get session platform
            const { data: session } = await supabase
                .from('chat_sessions').select('platform').eq('session_id', sessionId).single();

            // Send via WhatsApp only if WhatsApp session
            if (session?.platform === 'whatsapp') {
                await whatsappService.sendTextMessage(sessionId, content);
            }

            // Save to DB
            await supabase.from('chat_messages').insert([{
                session_id: sessionId, sender_type: 'admin', content
            }]);

            await supabase.from('chat_sessions')
                .update({ status: 'human_active', updated_at: new Date().toISOString() })
                .eq('session_id', sessionId);

            res.json({ success: true });
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // ── 3. End conversation ──────────────────────────────────────
    async endConversation(req, res) {
        try {
            const { sessionId } = req.body;
            if (!sessionId) return res.status(400).json({ success: false, error: 'Missing sessionId' });

            const { data: session } = await supabase
                .from('chat_sessions').select('platform').eq('session_id', sessionId).single();

            // Send farewell on WhatsApp
            if (session?.platform === 'whatsapp') {
                const farewell = 'شكراً لتواصلك مع هَوَسي 🤍\nنتمنى أننا قدرنا نساعدك!\nفي انتظار خدمتك دائماً. ⭐';
                await whatsappService.sendTextMessage(sessionId, farewell);
                await supabase.from('chat_messages').insert([{
                    session_id: sessionId, sender_type: 'bot', content: farewell
                }]);
            }

            // Close session
            await supabase.from('chat_sessions')
                .update({ status: 'closed', updated_at: new Date().toISOString() })
                .eq('session_id', sessionId);

            res.json({ success: true });
        } catch (error) {
            console.error('Error ending conversation:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // ── 4. Return session back to AI bot ─────────────────────────
    async returnToBot(req, res) {
        try {
            const { sessionId } = req.body;
            if (!sessionId) return res.status(400).json({ success: false, error: 'Missing sessionId' });

            const { data: session } = await supabase
                .from('chat_sessions').select('platform').eq('session_id', sessionId).single();

            if (session?.platform === 'whatsapp') {
                const botMsg = 'تم تحويلك للمساعد الذكي مجدداً 🤖\nأكتب أي سؤال وسأكون سعيداً بمساعدتك!';
                await whatsappService.sendTextMessage(sessionId, botMsg);
                await supabase.from('chat_messages').insert([{
                    session_id: sessionId, sender_type: 'bot', content: botMsg
                }]);
            }

            await supabase.from('chat_sessions')
                .update({ status: 'bot_active', updated_at: new Date().toISOString() })
                .eq('session_id', sessionId);

            res.json({ success: true });
        } catch (error) {
            console.error('Error returning to bot:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // ── 5. Proxy WhatsApp media ──────────────────────────────────
    async getWhatsAppMedia(req, res) {
        try {
            const mediaId = req.params.mediaId;
            const token = process.env.WHATSAPP_TOKEN;
            const apiVersion = process.env.WHATSAPP_API_VERSION || 'v20.0';

            const urlResponse = await fetch(`https://graph.facebook.com/${apiVersion}/${mediaId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const urlData = await urlResponse.json();
            if (!urlData.url) return res.status(404).send('Media not found');

            const mediaResponse = await fetch(urlData.url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!mediaResponse.ok) return res.status(mediaResponse.status).send('Failed to fetch media');

            res.setHeader('Content-Type', urlData.mime_type || 'image/jpeg');
            mediaResponse.body.pipe(res);
        } catch (error) {
            console.error('Error fetching WhatsApp media:', error);
            res.status(500).send('Internal Server Error');
        }
    }
}

module.exports = new AdminChatController();
