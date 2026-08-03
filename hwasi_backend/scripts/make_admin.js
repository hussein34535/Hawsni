const supabase = require('../config/supabase');

const email = process.argv[2];

if (!email) {
    console.error('❌ يرجى كتابة الإيميل. مثال: node scripts/make_admin.js test@example.com');
    process.exit(1);
}

async function makeAdmin() {
    console.log(`⏳ جاري تحويل الحساب ${email} إلى Admin...`);

    const { data, error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('email', email);

    if (error) {
        console.error('❌ فشل التحويل:', error.message);
    } else {
        console.log('✅ تم بنجاح! المستخدم الآن لديه صلاحيات المسؤول.');
        console.log('جرب تسجل دخول دلوقتي من لوحة التحكم.');
    }
    process.exit();
}

makeAdmin();
