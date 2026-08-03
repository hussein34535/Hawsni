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

            const nowDate = new Date();
            const now = nowDate.toISOString();

            // 1. Get or Create session
            let { data: session, error: getErr } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('session_id', sessionId)
                .maybeSingle();

            if (getErr) throw getErr;

            if (!session) {
                // Session does not exist, insert it
                const { data: newSession, error: insertErr } = await supabase
                    .from('chat_sessions')
                    .insert([{ session_id: sessionId, status: 'bot_active', updated_at: now, platform: 'web' }])
                    .select()
                    .single();

                if (insertErr) {
                    // Handle race condition: another request inserted it just now
                    if (insertErr.code === '23505') { // unique violation
                        const { data: retrySession } = await supabase
                            .from('chat_sessions')
                            .select('*')
                            .eq('session_id', sessionId)
                            .single();
                        session = retrySession;
                    } else {
                        throw insertErr;
                    }
                } else {
                    session = newSession;
                }
            }

            // 2. Check if this is a BRAND NEW session (created just now)
            // If created_at is very close to updated_at (which we just set to 'now'), it's new.
            // Or better: Check if chat_messages for this session exist.
            const { count: msgCount } = await supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('session_id', sessionId);

            if (msgCount === 0) {
                // Initialize new session
                const greetingStr = 'أهلاً بك في هَوَسي ✨\nنسعد بخدمتك.. كيف يمكننا مساعدتك اليوم؟';
                await supabase.from('chat_messages').insert([
                    { session_id: sessionId, sender_type: 'bot', content: greetingStr }
                ]);

                // Notify Admin
                const notificationService = require('../../services/notificationService');
                notificationService.sendTelegramText(`✨ *عميل جديد بدأ الشات!* \n📍 الجلسة: \`${sessionId}\``);
            } else {
                // SESSION EXISTS: Check Expiry (24 hours)
                // SESSION EXISTS: Check Expiry (24 hours)
                const lastActive = new Date(session.updated_at || session.created_at);
                const diffHours = (nowDate.getTime() - lastActive.getTime()) / (1000 * 3600);

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
                                updated_at: now,
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
                            .update({ updated_at: now })
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

            // 1. Insert user message to DB (always marked as read)
            const { data: userMsg, error: insertErr } = await supabase
                .from('chat_messages')
                .insert([{ session_id: sessionId, sender_type: 'user', content: message, is_read: true }])
                .select().single();
            if (insertErr) throw insertErr;

            // 1.5. Reactivate bot automatically if 24 hours passed
            const lastActive = new Date(session.updated_at || session.created_at);
            const diffHours = (new Date().getTime() - lastActive.getTime()) / (1000 * 3600);
            if (diffHours >= 24 && session.status !== 'bot_active') {
                console.log(`[Chat] ⏳ Session ${sessionId} was ${session.status} but expired. Reactivating bot.`);
                session.status = 'bot_active';
                await supabase.from('chat_sessions')
                    .update({ status: 'bot_active' })
                    .eq('session_id', sessionId);
            }

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

            const formattedHistory = (history || []).map(m => ({
                role: m.sender_type === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            })).filter(m => m.parts[0].text); // skip empty

            // CRITICAL FIX: Google AI requires history to start with a 'user' message.
            // Since our first message is usually a bot greeting, we must remove leading model messages.
            while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
                formattedHistory.shift();
            }

            // Pass the summary from session for persistent context
            const aiResponse = await aiChatbotService.handleChat(message, formattedHistory || [], sessionId, session.summary);

            // 4. Update updated_at and Insert AI response
            await supabase.from('chat_sessions')
                .update({ updated_at: new Date().toISOString() })
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
     * GET /api/chat/unread/:sessionId
     * Get unread message count for a session
     */
    async getUnreadCount(req, res) {
        try {
            const { sessionId } = req.params;
            if (!sessionId) return res.status(400).json({ success: false, error: 'Session ID required' });

            const { count, error } = await supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('session_id', sessionId)
                .in('sender_type', ['bot', 'admin'])
                .eq('is_read', false);

            if (error) throw error;

            return res.status(200).json({ success: true, unread: count || 0 });
        } catch (error) {
            // Column may not exist yet (migration not run)
            return res.status(200).json({ success: true, unread: 0 });
        }
    }

    /**
     * POST /api/chat/mark-read
     * Request body: { sessionId: "string" }
     */
    async markAsRead(req, res) {
        try {
            const { sessionId } = req.body;
            if (!sessionId) return res.status(400).json({ success: false, error: 'Session ID required' });

            const { error } = await supabase
                .from('chat_messages')
                .update({ is_read: true })
                .eq('session_id', sessionId)
                .in('sender_type', ['bot', 'admin'])
                .eq('is_read', false);

            if (error && !error.message?.includes('column')) throw error;

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('[ChatController markAsRead] Error:', error);
            return res.status(500).json({ success: false, error: 'حدث خطأ' });
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
                    updated_at: new Date().toISOString(),
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
