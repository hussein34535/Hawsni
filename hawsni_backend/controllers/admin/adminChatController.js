const supabase = require('../../config/supabase');

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
}

module.exports = new AdminChatController();
