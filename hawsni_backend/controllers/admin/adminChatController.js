const fetch = require('node-fetch');
const supabase = require('../../config/supabase');
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

    async sendMessage(req, res) {
        try {
            const { sessionId, content } = req.body;
            
            if (!sessionId || !content) {
                return res.status(400).json({ success: false, error: 'Missing sessionId or content' });
            }

            // 1. Send WhatsApp message
            await whatsappService.sendTextMessage(sessionId, content);

            // 2. Insert into database
            const { error } = await supabase
                .from('chat_messages')
                .insert([{ 
                    session_id: sessionId, 
                    sender_type: 'admin', 
                    content: content 
                }]);

            if (error) throw error;

            // 3. Update session status to human_active if it isn't already
            await supabase
                .from('chat_sessions')
                .update({ status: 'human_active', updated_at: new Date().toISOString() })
                .eq('session_id', sessionId);

            res.json({ success: true });
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getWhatsAppMedia(req, res) {
        try {
            const mediaId = req.params.mediaId;
            const token = process.env.WHATSAPP_TOKEN;
            const apiVersion = process.env.WHATSAPP_API_VERSION || 'v20.0';

            // 1. Get Media URL
            const urlResponse = await fetch(`https://graph.facebook.com/${apiVersion}/${mediaId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const urlData = await urlResponse.json();
            
            if (!urlData.url) {
                return res.status(404).send('Media not found');
            }

            // 2. Download Binary Data
            const mediaResponse = await fetch(urlData.url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!mediaResponse.ok) {
                return res.status(mediaResponse.status).send('Failed to fetch media');
            }

            // 3. Proxy to client
            res.setHeader('Content-Type', urlData.mime_type || 'image/jpeg');
            mediaResponse.body.pipe(res);
            
        } catch (error) {
            console.error('Error fetching WhatsApp media:', error);
            res.status(500).send('Internal Server Error');
        }
    }
}

module.exports = new AdminChatController();
