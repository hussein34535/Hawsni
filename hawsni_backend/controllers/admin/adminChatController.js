const fetch = require('node-fetch');
const { supabaseAdmin: supabase } = require('../../config/supabase');
const whatsappService = require('../../services/whatsappService');
const uploadToCloudinary = require('../../utils/fileUpload');

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

    // ── 0. List sessions with last message and unread count ──────
    async getSessions(req, res) {
        try {
            const { data: sessions, error } = await supabase
                .from('chat_sessions')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) throw error;

            const ids = sessions.map(s => s.session_id);
            const enriched = [];

            if (ids.length > 0) {
                // Fetch all messages for these sessions (latest first) to build last-message map
                const { data: allMsgs } = await supabase
                    .from('chat_messages')
                    .select('session_id, content, sender_type, created_at, is_read')
                    .in('session_id', ids)
                    .order('created_at', { ascending: false });

                let lastMap = {};
                let unreadMap = {};
                if (allMsgs) {
                    const seen = new Set();
                    for (const m of allMsgs) {
                        if (!seen.has(m.session_id)) {
                            seen.add(m.session_id);
                            lastMap[m.session_id] = { content: m.content, sender_type: m.sender_type };
                        }
                        if (m.is_read !== true) {
                            unreadMap[m.session_id] = (unreadMap[m.session_id] || 0) + 1;
                        }
                    }
                }

                for (const s of sessions) {
                    enriched.push({
                        ...s,
                        last_message: lastMap[s.session_id]?.content || null,
                        last_sender_type: lastMap[s.session_id]?.sender_type || null,
                        unread_count: unreadMap[s.session_id] || 0
                    });
                }
            }

            return res.json({ success: true, sessions: enriched });
        } catch (error) {
            console.error('[AdminChatController getSessions] Error:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    // ── 0.5 Get total unread count (for sidebar badge) ─────────
    async getUnreadCount(req, res) {
        try {
            const { count, error } = await supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('is_read', false)
                .eq('sender_type', 'user');

            if (error) throw error;
            return res.json({ success: true, count: count || 0 });
        } catch (error) {
            console.error('[AdminChatController getUnreadCount] Error:', error);
            return res.status(500).json({ success: false, error: error.message });
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
                const waResult = await whatsappService.sendTextMessage(sessionId, content);
                
                // Save to DB always (for history)
                const msgRow = { session_id: sessionId, sender_type: 'admin', content };
                if (waResult.wamid) {
                    msgRow.wa_message_id = waResult.wamid;
                    msgRow.wa_status = 'sent';
                } else if (!waResult.success) {
                    msgRow.wa_status = 'failed';
                }
                await supabase.from('chat_messages').insert([msgRow]);

                await supabase.from('chat_sessions')
                    .update({ status: 'human_active', updated_at: new Date().toISOString() })
                    .eq('session_id', sessionId);

                if (!waResult.success) {
                    return res.json({ 
                        success: false, 
                        error: waResult.error,
                        waError: true,
                        message: 'فشل إرسال رسالة واتساب — العميل خارج نافذة 24 ساعة. الرجاء استخدام القالب التأكيدي.'
                    });
                }
                return res.json({ 
                    success: true, 
                    message: 'تم الإرسال بنجاح',
                    fallback: waResult.fallback || false 
                });
            }

            // Save to DB for web sessions
            if (session?.platform === 'web') {
                await supabase.from('chat_messages').insert([{
                    session_id: sessionId, sender_type: 'admin', content
                }]);
            }

            await supabase.from('chat_sessions')
                .update({ status: 'human_active', updated_at: new Date().toISOString() })
                .eq('session_id', sessionId);

            res.json({ success: true });
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // ── 2.5 Send image (platform-aware) ─────────────────────────
    async sendImage(req, res) {
        try {
            const { sessionId } = req.body;
            if (!sessionId) {
                return res.status(400).json({ success: false, error: 'Missing sessionId' });
            }
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'Missing image file' });
            }

            // 1. Upload image to Cloudinary
            const result = await uploadToCloudinary(req.file, 'chat_media');
            const imageUrl = result.url;

            // 2. Get session platform
            const { data: session } = await supabase
                .from('chat_sessions').select('platform').eq('session_id', sessionId).single();

            // 3. Send via WhatsApp only if WhatsApp session
            if (session?.platform === 'whatsapp') {
                const waResult = await whatsappService.sendImageMessage(sessionId, imageUrl, 'admin');
                
                // Save to DB always (for history)
                const msgRow = { session_id: sessionId, sender_type: 'admin', content: `[IMAGE_URL:${imageUrl}]` };
                if (waResult.wamid) {
                    msgRow.wa_message_id = waResult.wamid;
                    msgRow.wa_status = 'sent';
                } else if (!waResult.success) {
                    msgRow.wa_status = 'failed';
                }
                await supabase.from('chat_messages').insert([msgRow]);

                if (!waResult.success) {
                    return res.json({ 
                        success: false, 
                        error: waResult.error,
                        waError: true,
                        message: waResult.windowClosed
                            ? 'العميل خارج نافذة 24 ساعة — لا يمكن إرسال صور خارج النافذة.'
                            : 'فشل إرسال الصورة عبر واتساب. يرجى التأكد من نافذة 24 ساعة.'
                    });
                }
            } else if (session?.platform === 'web') {
                // Save to DB for web sessions (outgoing admin image)
                await supabase.from('chat_messages').insert([{
                    session_id: sessionId, 
                    sender_type: 'admin', 
                    content: `[IMAGE_URL:${imageUrl}]`
                }]);
            }

            // 4. Update session status
            await supabase.from('chat_sessions')
                .update({ status: 'human_active', updated_at: new Date().toISOString() })
                .eq('session_id', sessionId);

            return res.json({ success: true, url: imageUrl });
        } catch (error) {
            console.error('Error sending image:', error);
            return res.status(500).json({ success: false, error: error.message });
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
            }

            // Save to DB (Only for Web)
            if (session?.platform === 'web') {
                 const farewell = 'شكراً لتواصلك مع هَوَسي 🤍\nنتمنى أننا قدرنا نساعدك!\nفي انتظار خدمتك دائماً. ⭐';
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

    // ── 5.5 Mark messages as read ────────────────────────────────
    async markRead(req, res) {
        try {
            const { sessionId } = req.body;
            if (!sessionId) return res.status(400).json({ success: false, error: 'Missing sessionId' });

            const { error } = await supabase
                .from('chat_messages')
                .update({ is_read: true })
                .eq('session_id', sessionId)
                .eq('is_read', false);

            if (error && !error.message?.includes('column')) throw error;
            res.json({ success: true });
        } catch (error) {
            console.error('[AdminChatController markRead] Error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // ── 6. Get orders for a session (by phone) ───────────────────
    async getSessionOrders(req, res) {
        try {
            const { sessionId } = req.params;
            if (!sessionId) return res.status(400).json({ success: false, error: 'Missing sessionId' });

            const digits = sessionId.replace(/\D/g, '');

            // Fetch recent orders and filter by phone in JS (avoids JSONB query issues)
            const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
            const { data: orders, error } = await supabase
                .from('orders')
                .select('id, order_number, status, total, created_at, shipping_address')
                .gte('created_at', threeMonthsAgo)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('[AdminChatController getSessionOrders] Supabase error:', error);
                return res.status(500).json({ success: false, error: error.message });
            }

            const matched = (orders || []).filter(o => {
                const phone = (o.shipping_address?.phone || '').replace(/\D/g, '');
                return phone.includes(digits) || digits.includes(phone);
            });

            const mapped = matched.map(o => ({
                id: o.id,
                order_number: o.order_number,
                status: o.status,
                total: o.total,
                created_at: o.created_at,
                customer_name: o.shipping_address?.name || o.shipping_address?.fullName || o.shipping_address?.customer_name || null,
                customer_address: o.shipping_address?.address || null
            }));

            res.json({ success: true, orders: mapped });
        } catch (error) {
            console.error('[AdminChatController getSessionOrders] Error:', error);
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
            if (!urlData.url) {
                // Return placeholder for expired media
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="#f1f5f9" rx="8"/><text x="100" y="65" text-anchor="middle" fill="#94a3b8" font-size="32">🖼️</text><text x="100" y="100" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="sans-serif">انتهت صلاحية الصورة</text></svg>`;
                res.setHeader('Content-Type', 'image/svg+xml');
                return res.send(svg);
            }

            const mediaResponse = await fetch(urlData.url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!mediaResponse.ok) {
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="#f1f5f9" rx="8"/><text x="100" y="65" text-anchor="middle" fill="#94a3b8" font-size="32">🖼️</text><text x="100" y="100" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="sans-serif">انتهت صلاحية الصورة</text></svg>`;
                res.setHeader('Content-Type', 'image/svg+xml');
                return res.send(svg);
            }

            res.setHeader('Content-Type', urlData.mime_type || 'image/jpeg');
            mediaResponse.body.pipe(res);
        } catch (error) {
            console.error('Error fetching WhatsApp media:', error);
            res.status(500).send('Internal Server Error');
        }
    }
}

module.exports = new AdminChatController();
