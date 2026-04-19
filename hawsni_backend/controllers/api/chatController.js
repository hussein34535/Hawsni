const aiChatbotService = require('../../services/aiChatbotService');
const supabase = require('../../config/supabase');
const emailService = require('../../services/emailService');

class ChatController {
    /**
     * GET /api/chat/session/:sessionId
     * Get or create a chat session, return messages
     */
    async getSession(req, res) {
        try {
            const { sessionId } = req.params;
            if (!sessionId) return res.status(400).json({ success: false, error: 'Session ID required' });

            // Fetch session
            let { data: session, error: sessionErr } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('session_id', sessionId)
                .single();

            // Create if it doesn't exist
            if (sessionErr || !session) {
                const { data: newSession, error: insertErr } = await supabase
                    .from('chat_sessions')
                    .insert([{ session_id: sessionId, status: 'bot_active' }])
                    .select().single();
                
                if (insertErr) throw insertErr;
                session = newSession;

                // Create initial bot greeting
                const greetingStr = 'أهلاً بيك في hwasi ✨\\nإزاي أقدر أساعدك النهاردة؟ ممكن أساعدك تدور على منتج أو تتبع طلبك.';
                await supabase.from('chat_messages').insert([
                    { session_id: sessionId, sender_type: 'bot', content: greetingStr }
                ]);
            }

            // Fetch all messages
            const { data: messages, error: msgsErr } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true });
            
            if (msgsErr) throw msgsErr;

            return res.status(200).json({ success: true, session, messages: messages || [] });
        } catch (error) {
            console.error('[ChatController getSession] Error:', error);
            return res.status(500).json({ success: false, error: 'حدث خطأ' });
        }
    }

    /**
     * POST /api/chat
     * Request body: { sessionId: "string", message: "string" }
     */
    async sendMessage(req, res) {
        try {
            const { sessionId, message } = req.body;

            if (!message || !sessionId) {
                return res.status(400).json({ success: false, error: 'رسالة و sessionId مطلوبين' });
            }

            // Check session status
            let { data: session } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('session_id', sessionId)
                .single();

            if (!session) {
                return res.status(404).json({ success: false, error: 'الجلسة غير موجودة' });
            }

            // Did we just start? Check message count to notify admin
            const { count } = await supabase.from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('session_id', sessionId);
            
            if (count === 1) { // Only the greeting exists
                await emailService.sendNewChatNotification(sessionId, message);
            }

            // 1. Insert user message to DB
            const { data: userMsg, error: insertErr } = await supabase
                .from('chat_messages')
                .insert([{ session_id: sessionId, sender_type: 'user', content: message }])
                .select().single();
            if (insertErr) throw insertErr;

            // 2. If status is human_active or human_requested, do NOT let AI answer
            if (session.status === 'human_active' || session.status === 'human_requested') {
                return res.status(200).json({
                    success: true,
                    botSkipped: true,
                    reply: '', // Handled by realtime on client
                });
            }

            // 3. Status is bot_active. Compile history from DB
            const { data: messages } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true });

            // Format for Gemini format
            const formattedHistory = (messages || []).map(m => ({
                role: m.sender_type === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            })).filter(m => m.parts[0].text); // skip empty

            // Remove the latest user message from history because we pass it directly
            formattedHistory.pop();

            // Call the AI Service
            const aiResponse = await aiChatbotService.handleChat(message, formattedHistory || [], sessionId); // Pass sessionId for advanced tools

            // Insert AI response to DB
            if (aiResponse && aiResponse.reply) {
                await supabase.from('chat_messages').insert([
                     { session_id: sessionId, sender_type: 'bot', content: aiResponse.reply }
                ]);
            }

            return res.status(200).json({
                success: true,
                reply: aiResponse.reply
            });

        } catch (error) {
            console.error('[ChatController] Error:', error);
            // insert fallback to db
            await supabase.from('chat_messages').insert([
                { session_id: req.body?.sessionId, sender_type: 'bot', content: 'حدث خطأ، يرجى المحاولة لاحقاً.' }
            ]);
            return res.status(500).json({ success: false, error: 'حدث خطأ غير متوقع' });
        }
    }
}

module.exports = new ChatController();
