const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

/**
 * Middleware to protect Admin SSR routes (EJS)
 */
exports.adminProtect = async (req, res, next) => {
    try {
        // 1. Get token from Cookie or Authorization header
        let token = req.cookies?.admin_token;

        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            if (req.headers.accept && req.headers.accept.includes('text/html')) {
                return res.redirect('/admin/login');
            }
            return res.status(401).json({ success: false, message: 'يرجى تسجيل الدخول كمسؤول' });
        }

        // 2. Verify with Supabase
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !authUser) {
            res.clearCookie('admin_token');
            if (req.headers.accept && req.headers.accept.includes('text/html')) {
                return res.redirect('/admin/login');
            }
            return res.status(401).json({ success: false, message: 'انتهت صلاحية الجلسة' });
        }

        // 3. Check Role in DB
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (profileError || !userProfile || userProfile.role !== 'admin') {
            return res.status(403).render('error', {
                message: 'ليس لديك صلاحيات المسؤول للوصول لهذه الصفحة.',
                error: { status: 403 }
            });
        }

        req.user = userProfile;
        next();
    } catch (error) {
        console.error('Admin Auth Error:', error);
        res.status(500).render('error', {
            message: 'حدث خطأ في المصادقة',
            error: error
        });
    }
};
