const { supabaseAdmin: supabase } = require('../../config/supabase');

class UsersController {
    async index(req, res) {
        try {
            const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
            const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 10), 100);
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            const search = String(req.query.q || '').trim().slice(0, 80);

            let query = supabase
                .from('users')
                .select('id, name, email, phone, avatar_url, role, is_phone_verified, is_email_verified, created_at', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            if (search) {
                const safe = search.replace(/[(),]/g, ' ');
                query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`);
            }

            const { data: users, error, count } = await query;
            if (error) throw error;

            const total = count || 0;
            res.render('users', {
                users: users || [],
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.max(Math.ceil(total / limit), 1)
                },
                search,
                page: 'users',
                title: 'إدارة المستخدمين'
            });
        } catch (err) {
            console.error('Error fetching users:', err);
            res.status(500).send('خطأ في تحميل المستخدمين');
        }
    }
}

module.exports = new UsersController();
