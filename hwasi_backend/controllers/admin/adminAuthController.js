const { supabaseAdmin, supabaseAuth } = require('../../config/supabase');

const cookieOptions = (isSecure) => ({
    httpOnly: true,
    secure: isSecure,
    sameSite: 'Lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
});

class AdminAuthController {
    renderLogin(req, res) {
        if (req.cookies.admin_token || req.cookies.admin_refresh_token) {
            return res.redirect('/admin/dashboard');
        }
        res.render('admin-login');
    }

    async login(req, res) {
        try {
            const email = String(req.body.email || '').trim().toLowerCase();
            const password = String(req.body.password || '');

            if (!email || !password || email.length > 254 || password.length > 200) {
                return res.status(400).render('admin-login', { error: 'بيانات الدخول غير صحيحة.' });
            }

            const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
            if (error) {
                return res.status(401).render('admin-login', { error: 'بيانات الدخول غير صحيحة.' });
            }

            const { session, user } = data;
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('users')
                .select('id, role')
                .eq('id', user.id)
                .maybeSingle();

            if (profileError || !profile || profile.role !== 'admin') {
                return res.status(403).render('admin-login', { error: 'عذراً، ليس لديك صلاحيات المسؤول.' });
            }

            const options = cookieOptions(req.secure || req.headers['x-forwarded-proto'] === 'https');
            res.cookie('admin_token', session.access_token, options);
            res.cookie('admin_refresh_token', session.refresh_token, options);
            res.redirect('/admin/dashboard');
        } catch (err) {
            console.error('Admin login error:', err.message);
            res.status(500).render('admin-login', { error: 'حدث خطأ غير متوقع.' });
        }
    }

    logout(req, res) {
        const options = cookieOptions(req.secure || req.headers['x-forwarded-proto'] === 'https');
        res.clearCookie('admin_token', { ...options, maxAge: undefined });
        res.clearCookie('admin_refresh_token', { ...options, maxAge: undefined });
        res.redirect('/admin/login');
    }
}

module.exports = new AdminAuthController();
