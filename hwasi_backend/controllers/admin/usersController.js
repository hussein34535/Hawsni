const supabase = require('../../config/supabase');

class UsersController {
    // List all users
    async index(req, res) {
        try {
            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            res.render('users', { users });
        } catch (err) {
            console.error('Error fetching users:', err);
            res.status(500).send('خطأ في تحميل المستخدمين');
        }
    }
}

module.exports = new UsersController();
