const fetch = require('node-fetch');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_URL = 'https://api.resend.com/emails';
const SENDER = 'Hawsni <noreply@hwasi.com>';
const ADMIN_EMAIL = 'hussona4635@gmail.com';

/**
 * Low-level Resend send helper.
 * @param {Object} opts – { to, subject, htmlContent }
 */
async function _send({ to, subject, htmlContent }) {
    const res = await fetch(RESEND_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: SENDER,
            to: [to],
            subject,
            html: htmlContent,
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        console.error('❌ Resend email error:', res.status, body);
        throw new Error(`Resend error ${res.status}: ${body}`);
    }

    const data = await res.json();
    console.log(`✅ Email sent to ${to} — id: ${data.id}`);
    return data;
}

// ──────────────────────────────────────────────
// 1. OTP Verification Email
// ──────────────────────────────────────────────
async function sendOtpEmail(toEmail, userName, otpCode) {
    return _send({
        to: toEmail,
        subject: 'رمز التحقق من حساب Hwasi',
        htmlContent: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #10b981; margin: 0;">مرحباً بك في Hwasi! 🎉</h1>
            </div>
            <p style="font-size: 16px; color: #374151;">مرحباً ${userName}،</p>
            <p style="font-size: 15px; color: #4b5563;">شكراً لانضمامك إلينا. لإكمال تسجيلك، يرجى استخدام رمز التحقق التالي:</p>
            <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ffffff;">${otpCode}</span>
            </div>
            <p style="color: #9ca3af; font-size: 13px; text-align: center;">
                ⏱️ صلاحية هذا الرمز 10 دقائق. إذا لم تطلب هذا الرمز، تجاهل هذه الرسالة.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">Hwasi — تسوّق بذكاء ✨</p>
        </div>`,
    });
}

// ──────────────────────────────────────────────
// 2. Password Reset Email
// ──────────────────────────────────────────────
async function sendPasswordResetEmail(toEmail, resetToken) {
    // Build a deep link or web link the user can use
    const resetLink = `io.supabase.hwasiapp://reset-password?token=${resetToken}`;

    return _send({
        to: toEmail,
        subject: 'إعادة تعيين كلمة المرور — Hwasi',
        htmlContent: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #f59e0b; text-align: center;">🔐 إعادة تعيين كلمة المرور</h2>
            <p style="font-size: 15px; color: #374151;">مرحباً،</p>
            <p style="font-size: 15px; color: #4b5563;">لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. استخدم الرمز التالي في التطبيق:</p>
            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
                <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #ffffff;">${resetToken}</span>
            </div>
            <p style="color: #9ca3af; font-size: 13px; text-align: center;">
                إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذه الرسالة. حسابك آمن.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">Hwasi — تسوّق بذكاء ✨</p>
        </div>`,
    });
}

// ──────────────────────────────────────────────
// 3. Order Confirmation Email
// ──────────────────────────────────────────────
async function sendOrderConfirmationEmail(toEmail, userName, order) {
    const itemsHtml = (order.items || []).map(item => `
        <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6;">${item.name}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6; text-align: left;">${item.price} ج.م</td>
        </tr>
    `).join('');

    return _send({
        to: toEmail,
        subject: `تأكيد طلبك #${order.id.substring(0, 8).toUpperCase()} — Hwasi`,
        htmlContent: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #10b981; text-align: center;">🛒 تم تأكيد طلبك بنجاح!</h2>
            <p style="font-size: 15px; color: #374151;">مرحباً ${userName}،</p>
            <p style="font-size: 15px; color: #4b5563;">شكراً لطلبك من Hwasi. إليك تفاصيل طلبك:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px; color: #374151;">
                <thead>
                    <tr style="background: #f9fafb;">
                        <th style="padding: 10px 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">المنتج</th>
                        <th style="padding: 10px 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">الكمية</th>
                        <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">السعر</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            <div style="background: #f9fafb; padding: 12px; border-radius: 8px; text-align: left; font-size: 18px; font-weight: bold; color: #1f2937;">
                الإجمالي: ${order.total_amount || '—'} ج.م
            </div>
            <p style="color: #9ca3af; font-size: 13px; text-align: center; margin-top: 15px;">
                سنقوم بإعلامك عند تحديث حالة طلبك.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">Hwasi — تسوّق بذكاء ✨</p>
        </div>`,
    });
}

// ──────────────────────────────────────────────
// 4. Order Status Update Email
// ──────────────────────────────────────────────
const STATUS_LABELS = {
    'Processing': { ar: 'قيد المعالجة', emoji: '⏳', color: '#3b82f6' },
    'Shipped': { ar: 'تم الشحن', emoji: '🚚', color: '#8b5cf6' },
    'Delivered': { ar: 'تم التوصيل', emoji: '✅', color: '#10b981' },
    'Cancelled': { ar: 'ملغي', emoji: '❌', color: '#ef4444' },
};

async function sendOrderStatusEmail(toEmail, userName, orderId, status) {
    const label = STATUS_LABELS[status] || { ar: status, emoji: '📦', color: '#6b7280' };

    return _send({
        to: toEmail,
        subject: `تحديث حالة طلبك #${orderId.substring(0, 8).toUpperCase()} — Hwasi`,
        htmlContent: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
            <h2 style="color: ${label.color}; text-align: center;">${label.emoji} تحديث حالة الطلب</h2>
            <p style="font-size: 15px; color: #374151;">مرحباً ${userName}،</p>
            <p style="font-size: 15px; color: #4b5563;">تم تحديث حالة طلبك <strong>#${orderId.substring(0, 8).toUpperCase()}</strong> إلى:</p>
            <div style="background: ${label.color}; padding: 15px; border-radius: 10px; text-align: center; margin: 20px 0;">
                <span style="font-size: 22px; font-weight: bold; color: #ffffff;">${label.emoji} ${label.ar}</span>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">Hwasi — تسوّق بذكاء ✨</p>
        </div>`,
    });
}

// ──────────────────────────────────────────────
// 5. Admin Notification Email
// ──────────────────────────────────────────────
async function sendAdminNotification(subject, htmlContent) {
    return _send({
        to: ADMIN_EMAIL,
        subject: `[ADMIN INFO] ${subject}`,
        htmlContent: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #10b981;">Hawsni Alert 🔔</h2>
            <div style="font-size: 15px; color: #333; line-height: 1.6;">
                ${htmlContent}
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">This is an automated notification from Hawsni System.</p>
        </div>`
    });
}

module.exports = {
    sendOtpEmail,
    sendPasswordResetEmail,
    sendOrderConfirmationEmail,
    sendOrderStatusEmail,
    sendAdminNotification,
};
