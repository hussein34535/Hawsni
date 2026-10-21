const { supabaseAdmin, supabaseAuth } = require('../config/supabase');

exports.adminProtect = async (req, res, next) => {
    try {
        let token = req.cookies?.admin_token;

        if (!token && req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            if (req.headers.accept?.includes('text/html')) {
                return res.redirect('/admin/login');
            }
            return res.status(401).json({ success: false, message: 'يرجى تسجيل الدخول كمسؤول' });
        }

        let { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !authUser) {
            const refreshToken = req.cookies?.admin_refresh_token;
            if (refreshToken) {
                const { data: refreshData, error: refreshError } = await supabaseAuth.auth.setSession({
                    access_token: token || '',
                    refresh_token: refreshToken
                });

                if (!refreshError && refreshData.session) {
                    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
                    const cookieOptions = {
                        httpOnly: true,
                        secure: isSecure,
                        sameSite: 'Lax',
                        path: '/',
                        maxAge: 7 * 24 * 60 * 60 * 1000
                    };
                    res.cookie('admin_token', refreshData.session.access_token, cookieOptions);
                    res.cookie('admin_refresh_token', refreshData.session.refresh_token, cookieOptions);
                    authUser = refreshData.session.user;
                    authError = null;
                }
            }
        }

        if (authError || !authUser) {
            res.clearCookie('admin_token', { path: '/' });
            res.clearCookie('admin_refresh_token', { path: '/' });
            if (req.headers.accept?.includes('text/html')) {
                return res.redirect('/admin/login');
            }
            return res.status(401).json({ success: false, message: 'انتهت صلاحية الجلسة' });
        }

        const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('id, name, email, role, avatar_url')
            .eq('id', authUser.id)
            .maybeSingle();

        if (profileError || !userProfile || userProfile.role !== 'admin') {
            return res.status(403).render('error', {
                message: 'ليس لديك صلاحيات المسؤول للوصول لهذه الصفحة.',
                error: { status: 403 }
            });
        }

        req.user = userProfile;
        next();
    } catch (error) {
        console.error('Admin auth error:', error.message);
        res.status(500).render('error', {
            message: 'حدث خطأ في المصادقة',
            error: { status: 500 }
        });
    }
};
