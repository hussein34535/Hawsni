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

            const now = new Date();

            // Create if it doesn't exist
            if (sessionErr || !session) {
                const { data: newSession, error: insertErr } = await supabase
                    .from('chat_sessions')
                    .insert([{ session_id: sessionId, status: 'bot_active', last_active_at: now.toISOString() }])
                    .select().single();
                
                if (insertErr) throw insertErr;
                session = newSession;

                // Create initial bot greeting
                const greetingStr = 'أهلاً بك في هَوَسي ✨\nنسعد بخدمتك.. كيف يمكننا مساعدتك اليوم؟';
                await supabase.from('chat_messages').insert([
                    { session_id: sessionId, sender_type: 'bot', content: greetingStr }
                ]);

                // Notify Admin about new chat session
                const notificationService = require('../../services/notificationService');
                notificationService.sendTelegramText(`✨ *عميل جديد بدأ الشات!* \n📍 الجلسة: \`${sessionId}\``);
            } else {
                // SESSION EXISTS: Check Expiry (24 hours)
                const lastActive = new Date(session.last_active_at || session.created_at);
                const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 3600);

                if (diffHours >= 24) {
                    console.log(`[Chat] ⏳ Session ${sessionId} expired (${diffHours.toFixed(1)}h). Summarizing...`);
                    
                    // 1. Fetch current messages for summary
                    const { data: oldMsgs } = await supabase
                        .from('chat_messages')
                        .select('*')
                        .eq('session_id', sessionId)
                        .order('created_at', { ascending: true });

                    if (oldMsgs && oldMsgs.length > 5) {
                        const formattedHistory = oldMsgs.map(m => ({
                            role: m.sender_type === 'user' ? 'user' : 'model',
                            parts: [{ text: m.content }]
                        }));
                        const newSummary = await aiChatbotService.summarizeChat(formattedHistory);
                        
                        // 2. Update session with summary and reset status
                        await supabase.from('chat_sessions')
                            .update({ 
                                summary: newSummary, 
                                last_active_at: now.toISOString(),
                                status: 'bot_active' 
                            })
                            .eq('session_id', sessionId);
                        
                        // 3. Clear old messages to save space
                        await supabase.from('chat_messages').delete().eq('session_id', sessionId);

                        // 4. Send fresh greeting
                        const greetingStr = 'أهلاً بك مجدداً في هَوَسي ✨\nكيف يمكنني مساعدتك اليوم؟';
                        await supabase.from('chat_messages').insert([
                            { session_id: sessionId, sender_type: 'bot', content: greetingStr }
                        ]);
                    } else {
                        // Just update time if not enough history to summarize
                        await supabase.from('chat_sessions')
                            .update({ last_active_at: now.toISOString() })
                            .eq('session_id', sessionId);
                    }
                }
            }

            // Fetch all current messages
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

            // 2. If status is human_active or closed, bot is silenced.
            if (session.status === 'human_active' || session.status === 'closed') {
                console.log(`[Chat] 🤖 Bot is silenced for session ${sessionId} (Status: ${session.status})`);
                return res.status(200).json({
                    success: true,
                    botSkipped: true,
                    reply: '', // Handled by manual intervention
                });
            }

            // 3. Get AI Response
            const { data: history } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true })
                .limit(20);

            const formattedHistory = history?.map(m => ({
                role: m.sender_type === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }));

            // Pass the summary from session for persistent context
            const aiResponse = await aiChatbotService.handleChat(message, formattedHistory || [], sessionId, session.summary);

            // 4. Update last_active_at and Insert AI response
            await supabase.from('chat_sessions')
                .update({ last_active_at: new Date().toISOString() })
                .eq('session_id', sessionId);

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

    /**
     * POST /api/chat/reset
     * Request body: { sessionId: "string" }
     */
    async resetSession(req, res) {
        try {
            const { sessionId } = req.body;
            if (!sessionId) return res.status(400).json({ success: false, error: 'Session ID required' });

            // 1. Fetch messages for summary
            const { data: oldMsgs } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true });

            let newSummary = "";
            if (oldMsgs && oldMsgs.length > 3) {
                const formattedHistory = oldMsgs.map(m => ({
                    role: m.sender_type === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }]
                }));
                newSummary = await aiChatbotService.summarizeChat(formattedHistory);
            }

            // 2. Update session with summary and reset activity
            await supabase.from('chat_sessions')
                .update({ 
                    summary: newSummary, 
                    last_active_at: new Date().toISOString(),
                    status: 'bot_active' 
                })
                .eq('session_id', sessionId);
            
            // 3. Clear old messages
            await supabase.from('chat_messages').delete().eq('session_id', sessionId);

            // 4. Send fresh greeting
            const greetingStr = 'تمت إعادة تعيين الدردشة بنجاح. كيف يمكنني مساعدتك اليوم؟';
            await supabase.from('chat_messages').insert([
                { session_id: sessionId, sender_type: 'bot', content: greetingStr }
            ]);

            return res.status(200).json({ success: true, message: 'Chat reset successful' });
        } catch (error) {
            console.error('[ChatController resetSession] Error:', error);
            return res.status(500).json({ success: false, error: 'حدث خطأ أثناء إعادة التعيين' });
        }
    }
}

module.exports = new ChatController();
