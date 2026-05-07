const supabase = require('../../config/supabase');
const { supabaseAuth } = require('../../config/supabase');

class AdminAuthController {
    // Show login page
    renderLogin(req, res) {
        if (req.cookies.admin_token || req.cookies.admin_refresh_token) {
            return res.redirect('/admin/dashboard');
        }
        res.render('admin-login');
    }

    // Handle login
    async login(req, res) {
        try {
            const { email, password } = req.body;
            console.log(`[ADMIN LOGIN] Attempting login for: ${email}`);

            // 1. Sign in with Supabase
            const { data, error } = await supabaseAuth.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error(`[ADMIN LOGIN ERROR] Invalid credentials for ${email}: ${error.message}`);
                return res.render('admin-login', { error: 'بيانات الدخول غير صحيحة.' });
            }

            const { session, user } = data;

            // 2. Check if user is Admin in profiles table
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('role, email')
                .eq('id', user.id)
                .single();

            console.log('--- Admin Login Attempt ---');
            console.log('User ID:', user.id);
            console.log('Profile found:', profile);
            console.log('Profile error:', profileError);

            if (profileError || !profile || profile.role !== 'admin') {
                console.warn(`Access denied for user ${user.email}. Role: ${profile?.role}`);
                return res.render('admin-login', { error: 'عذراً، ليس لديك صلاحيات المسؤول.' });
            }

            // 3. Set Cookies (Access Token + Refresh Token)
            const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
            const cookieOptions = {
                httpOnly: true,
                secure: isSecure,
                sameSite: isSecure ? 'None' : 'Lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            };

            res.cookie('admin_token', session.access_token, cookieOptions);
            res.cookie('admin_refresh_token', session.refresh_token, cookieOptions);

            res.redirect('/admin/dashboard');
        } catch (err) {
            console.error('Admin Login Error:', err);
            res.render('admin-login', { error: 'حدث خطأ غير متوقع.' });
        }
    }

    // Handle logout
    logout(req, res) {
        res.clearCookie('admin_token');
        res.clearCookie('admin_refresh_token');
        res.redirect('/admin/login');
    }
}

module.exports = new AdminAuthController();
