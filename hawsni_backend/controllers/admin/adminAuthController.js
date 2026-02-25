const supabase = require('../../config/supabase');

class AdminAuthController {
    // Show login page
    renderLogin(req, res) {
        if (req.cookies.admin_token) {
            return res.redirect('/dashboard');
        }
        res.render('admin-login');
    }

    // Handle login
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // 1. Sign in with Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                return res.render('admin-login', { error: 'بيانات الدخول غير صحيحة.' });
            }

            const { session, user } = data;

            // 2. Check if user is Admin in profiles table
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profileError || !profile || profile.role !== 'admin') {
                return res.render('admin-login', { error: 'عذراً، ليس لديك صلاحيات المسؤول.' });
            }

            // 3. Set Cookie
            res.cookie('admin_token', session.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.redirect('/dashboard');
        } catch (err) {
            console.error('Admin Login Error:', err);
            res.render('admin-login', { error: 'حدث خطأ غير متوقع.' });
        }
    }

    // Handle logout
    logout(req, res) {
        res.clearCookie('admin_token');
        res.redirect('/admin/login');
    }
}

module.exports = new AdminAuthController();
