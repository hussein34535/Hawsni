const aiChatbotService = require('../../services/aiChatbotService');
const { supabaseAdmin: supabase } = require('../../config/supabase');
const emailService = require('../../services/emailService');

// Auto-replies are disabled by default. Set AI_AUTO_REPLY_ENABLED=true to re-enable.
const AI_AUTO_REPLY_ENABLED = process.env.AI_AUTO_REPLY_ENABLED === 'true';
const SESSION_RE = /^[A-Za-z0-9_-]{8,100}$/;

const isValidSessionId = (value) => SESSION_RE.test(String(value || ''));

class ChatController {
    /**
     * GET /api/chat/session/:sessionId
     * Get or create a web chat session, return the latest messages.
     */
    async getSession(req, res) {
        try {
            const { sessionId } = req.params;
            if (!isValidSessionId(sessionId)) {
                return res.status(400).json({ success: false, error: 'Invalid session ID' });
            }

            const nowDate = new Date();
            const now = nowDate.toISOString();

            let { data: session, error: getErr } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('session_id', sessionId)
                .maybeSingle();

            if (getErr) throw getErr;

            if (session && session.platform !== 'web') {
                return res.status(403).json({ success: false, error: 'This session is not available on the web channel' });
            }

            if (!session) {
                const { data: newSession, error: insertErr } = await supabase
                    .from('chat_sessions')
                    .insert([{ session_id: sessionId, status: 'bot_active', updated_at: now, platform: 'web' }])
                    .select()
                    .single();

                if (insertErr) {
                    if (insertErr.code === '23505') {
                        const { data: retrySession, error: retryError } = await supabase
                            .from('chat_sessions')
                            .select('*')
                            .eq('session_id', sessionId)
                            .maybeSingle();
                        if (retryError) throw retryError;
                        if (!retrySession || retrySession.platform !== 'web') {
                            return res.status(403).json({ success: false, error: 'This session is not available on the web channel' });
                        }
                        session = retrySession;
                    } else {
                        throw insertErr;
                    }
                } else {
                    session = newSession;
                }
            }

            const { count: msgCount, error: countError } = await supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('session_id', sessionId);
            if (countError) throw countError;

            if (msgCount === 0) {
                const greetingStr = 'أهلاً بك في هَوَسي ✨\nنسعد بخدمتك.. كيف يمكننا مساعدتك اليوم؟';
                await supabase.from('chat_messages').insert([
                    { session_id: sessionId, sender_type: 'bot', content: greetingStr }
                ]);

                const notificationService = require('../../services/notificationService');
                notificationService.sendTelegramText(`✨ *عميل جديد بدأ الشات!* \n📍 الجلسة: \`${sessionId}\``);
            } else {
                const lastActive = new Date(session.updated_at || session.created_at);
                const diffHours = (nowDate.getTime() - lastActive.getTime()) / (1000 * 3600);

                if (diffHours >= 24) {
                    await supabase.from('chat_sessions')
                        .update({ updated_at: now })
                        .eq('session_id', sessionId);
                }
            }

            const { data: recentMessages, error: msgsErr } = await supabase
                .from('chat_messages')
                .select('id, session_id, sender_type, content, created_at, is_read')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: false })
                .limit(200);
            if (msgsErr) throw msgsErr;

            const messages = (recentMessages || []).slice().reverse();
            return res.status(200).json({ success: true, session, messages });
        } catch (error) {
            console.error('[ChatController getSession] Error:', error.message);
            return res.status(500).json({ success: false, error: 'حدث خطأ' });
        }
    }

    /**
     * GET /api/chat/messages/:sessionId?after=ISO
     * Poll only new messages for a web session.
     */
    async getMessages(req, res) {
        try {
            const { sessionId } = req.params;
            if (!isValidSessionId(sessionId)) {
                return res.status(400).json({ success: false, error: 'Invalid session ID' });
            }

            const { data: session, error: sessionError } = await supabase
                .from('chat_sessions')
                .select('platform')
                .eq('session_id', sessionId)
                .maybeSingle();
            if (sessionError) throw sessionError;
            if (!session || session.platform !== 'web') {
                return res.status(403).json({ success: false, error: 'Session unavailable' });
            }

            const after = String(req.query.after || '').trim();
            const afterDate = after ? new Date(after) : null;
            if (afterDate && Number.isNaN(afterDate.getTime())) {
                return res.status(400).json({ success: false, error: 'Invalid after value' });
            }

            let query = supabase
                .from('chat_messages')
                .select('id, session_id, sender_type, content, created_at, is_read')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true })
                .limit(200);

            if (afterDate) {
                query = query.gt('created_at', afterDate.toISOString());
            }

            const { data: messages, error } = await query;
            if (error) throw error;

            return res.status(200).json({ success: true, messages: messages || [] });
        } catch (error) {
            console.error('[ChatController getMessages] Error:', error.message);
            return res.status(500).json({ success: false, error: 'حدث خطأ' });
        }
    }

    /**
     * POST /api/chat
     * Request body: { sessionId: "string", message: "string" }
     */
    async sendMessage(req, res) {
        try {
            const sessionId = String(req.body?.sessionId || '');
            const message = String(req.body?.message || '').trim();

            if (!isValidSessionId(sessionId) || !message || message.length > 2000) {
                return res.status(400).json({ success: false, error: 'رسالة و sessionId صحيحين مطلوبين' });
            }

            const { data: session, error: sessionError } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('session_id', sessionId)
                .maybeSingle();
            if (sessionError) throw sessionError;
            if (!session || session.platform !== 'web') {
                return res.status(403).json({ success: false, error: 'الجلسة غير متاحة' });
            }

            const { count } = await supabase.from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('session_id', sessionId);

            if (count === 1) {
                emailService.sendNewChatNotification(sessionId, message).catch(() => {});
            }

            const { error: insertErr } = await supabase
                .from('chat_messages')
                .insert([{ session_id: sessionId, sender_type: 'user', content: message, is_read: false }]);
            if (insertErr) throw insertErr;

            if (!AI_AUTO_REPLY_ENABLED) {
                const nextStatus = session.status === 'human_active' ? 'human_active' : 'human_requested';
                await supabase.from('chat_sessions')
                    .update({ status: nextStatus, updated_at: new Date().toISOString() })
                    .eq('session_id', sessionId);
                return res.status(200).json({ success: true, botSkipped: true, reply: '' });
            }

            const lastActive = new Date(session.updated_at || session.created_at);
            const diffHours = (new Date().getTime() - lastActive.getTime()) / (1000 * 3600);
            if (diffHours >= 24 && session.status !== 'bot_active') {
                session.status = 'bot_active';
                await supabase.from('chat_sessions')
                    .update({ status: 'bot_active' })
                    .eq('session_id', sessionId);
            }

            if (session.status === 'human_active' || session.status === 'closed') {
                return res.status(200).json({ success: true, botSkipped: true, reply: '' });
            }

            const { data: history } = await supabase
                .from('chat_messages')
                .select('session_id, sender_type, content, created_at')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true })
                .limit(20);

            const formattedHistory = (history || []).map(m => ({
                role: m.sender_type === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            })).filter(m => m.parts[0].text);

            while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
                formattedHistory.shift();
            }

            const aiResponse = await aiChatbotService.handleChat(message, formattedHistory || [], sessionId, session.summary);

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
            console.error('[ChatController sendMessage] Error:', error.message);
            return res.status(500).json({ success: false, error: 'حدث خطأ غير متوقع' });
        }
    }

    /**
     * GET /api/chat/unread/:sessionId
     */
    async getUnreadCount(req, res) {
        try {
            const { sessionId } = req.params;
            if (!isValidSessionId(sessionId)) {
                return res.status(400).json({ success: false, error: 'Invalid session ID' });
            }

            const { data: session } = await supabase
                .from('chat_sessions')
                .select('platform')
                .eq('session_id', sessionId)
                .maybeSingle();
            if (!session || session.platform !== 'web') {
                return res.status(403).json({ success: false, error: 'Session unavailable' });
            }

            const { count, error } = await supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('session_id', sessionId)
                .in('sender_type', ['bot', 'admin'])
                .eq('is_read', false);
            if (error) throw error;

            return res.status(200).json({ success: true, unread: count || 0 });
        } catch (error) {
            return res.status(200).json({ success: true, unread: 0 });
        }
    }

    /**
     * POST /api/chat/mark-read
     */
    async markAsRead(req, res) {
        try {
            const sessionId = String(req.body?.sessionId || '');
            if (!isValidSessionId(sessionId)) {
                return res.status(400).json({ success: false, error: 'Invalid session ID' });
            }

            const { data: session } = await supabase
                .from('chat_sessions')
                .select('platform')
                .eq('session_id', sessionId)
                .maybeSingle();
            if (!session || session.platform !== 'web') {
                return res.status(403).json({ success: false, error: 'Session unavailable' });
            }

            const { error } = await supabase
                .from('chat_messages')
                .update({ is_read: true })
                .eq('session_id', sessionId)
                .in('sender_type', ['bot', 'admin'])
                .eq('is_read', false);
            if (error && !error.message?.includes('column')) throw error;

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('[ChatController markAsRead] Error:', error.message);
            return res.status(500).json({ success: false, error: 'حدث خطأ' });
        }
    }

    /**
     * POST /api/chat/reset
     */
    async resetSession(req, res) {
        try {
            const sessionId = String(req.body?.sessionId || '');
            if (!isValidSessionId(sessionId)) {
                return res.status(400).json({ success: false, error: 'Invalid session ID' });
            }

            const { data: session, error: sessionError } = await supabase
                .from('chat_sessions')
                .select('platform')
                .eq('session_id', sessionId)
                .maybeSingle();
            if (sessionError) throw sessionError;
            if (!session || session.platform !== 'web') {
                return res.status(403).json({ success: false, error: 'Session unavailable' });
            }

            const { data: oldMsgs } = await supabase
                .from('chat_messages')
                .select('sender_type, content')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true });

            let newSummary = '';
            if (AI_AUTO_REPLY_ENABLED && oldMsgs && oldMsgs.length > 3) {
                const formattedHistory = oldMsgs.map(m => ({
                    role: m.sender_type === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }]
                }));
                newSummary = await aiChatbotService.summarizeChat(formattedHistory);
            }

            await supabase.from('chat_sessions')
                .update({
                    summary: newSummary,
                    updated_at: new Date().toISOString(),
                    status: 'bot_active'
                })
                .eq('session_id', sessionId);

            await supabase.from('chat_messages').delete().eq('session_id', sessionId);

            const greetingStr = 'تمت إعادة تعيين الدردشة بنجاح. كيف يمكنني مساعدتك اليوم؟';
            await supabase.from('chat_messages').insert([
                { session_id: sessionId, sender_type: 'bot', content: greetingStr }
            ]);

            return res.status(200).json({ success: true, message: 'Chat reset successful' });
        } catch (error) {
            console.error('[ChatController resetSession] Error:', error.message);
            return res.status(500).json({ success: false, error: 'حدث خطأ أثناء إعادة التعيين' });
        }
    }
}

module.exports = new ChatController();
