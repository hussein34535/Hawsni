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
        subject: 'رمز التحقق الخاص بك — Hawsni',
        htmlContent: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 40px; border-radius: 24px; background-color: #ffffff; border: 1px solid #f0f0f0; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #0E4435; margin: 0; font-size: 28px; font-weight: 900;">Hawsni</h1>
                <p style="color: #666; font-size: 14px; margin-top: 5px; font-weight: bold;">الفخامة في كل تفصيلة</p>
            </div>
            
            <div style="text-align: right; margin-bottom: 30px;">
                <h2 style="color: #1a1a1a; font-size: 20px; font-weight: 800; margin-bottom: 10px;">مرحباً ${userName}،</h2>
                <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0;">شكراً لاهتمامك بـ Hawsni. لإكمال عملية التحقق، يرجى استخدام الرمز التالي:</p>
            </div>

            <div style="background: #f8faf9; border: 2px dashed #0E4435; padding: 25px; border-radius: 20px; text-align: center; margin: 30px 0;">
                <span style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #0E4435; display: block;">${otpCode}</span>
            </div>

            <p style="color: #999; font-size: 13px; text-align: center; line-height: 1.6;">
                هذا الرمز صالح لمدة 10 دقائق فقط.<br> إذا لم تكن أنت من طلب هذا الرمز، يرجى تجاهل هذا الإيميل.
            </p>

            <div style="border-top: 1px solid #eee; margin-top: 40px; pt: 20px; text-align: center;">
                <p style="color: #0E4435; font-size: 12px; font-weight: 900; margin: 20px 0 0 0;">Hawsni — Premium Fashion ✨</p>
            </div>
        </div>`,
    });
}

// ──────────────────────────────────────────────
// 2. Password Reset Email
// ──────────────────────────────────────────────
async function sendPasswordResetEmail(toEmail, resetToken) {
    return _send({
        to: toEmail,
        subject: 'إعادة تعيين كلمة المرور — Hawsni',
        htmlContent: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 550px; margin: 0 auto; padding: 40px; border-radius: 24px; background-color: #ffffff; border: 1px solid #f0f0f0;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #0E4435; margin: 0; font-size: 28px; font-weight: 900;">Hawsni</h1>
            </div>
            
            <h2 style="color: #1a1a1a; font-size: 20px; font-weight: 800; text-align: center; margin-bottom: 20px;">🔐 استعادة الوصول لحسابك</h2>
            <p style="color: #4a4a4a; font-size: 15px; text-align: center; line-height: 1.6;">لقد تلقينا طلباً لإعادة تعيين كلمة المرور. استخدم الرمز التالي داخل التطبيق:</p>

            <div style="background: #0E4435; padding: 20px; border-radius: 20px; text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #ffffff;">${resetToken}</span>
            </div>

            <p style="color: #999; font-size: 13px; text-align: center;">
                إذا لم تطلب هذا التغيير، حسابك لا يزال آمناً ويمكنك تجاهل الرسالة.
            </p>
        </div>`,
    });
}

// ──────────────────────────────────────────────
// 3. Order Confirmation Email
// ──────────────────────────────────────────────
async function sendOrderConfirmationEmail(toEmail, userName, order) {
    const itemsHtml = (order.order_items || order.items || []).map(item => `
        <tr>
            <td style="padding: 15px 0; border-bottom: 1px solid #f0f0f0;">
                <p style="margin: 0; font-weight: 800; color: #1a1a1a; font-size: 14px;">${item.name || (item.products && item.products.name)}</p>
                <p style="margin: 5px 0 0 0; color: #999; font-size: 11px;">المقاس: ${item.size || 'عادي'} | الكمية: ${item.quantity}</p>
            </td>
            <td style="padding: 15px 0; border-bottom: 1px solid #f0f0f0; text-align: left; font-weight: 900; color: #0E4435;">
                ${(item.price * item.quantity).toLocaleString()} ج.م
            </td>
        </tr>
    `).join('');

    return _send({
        to: toEmail,
        subject: `تم استلام طلبك رقم #${order.id.toString().substring(0, 6).toUpperCase()} — Hawsni`,
        htmlContent: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 24px; background-color: #ffffff; border: 1px solid #f0f0f0;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #0E4435; margin: 0; font-size: 28px; font-weight: 900;">Hawsni</h1>
            </div>

            <div style="background-color: #f8faf9; padding: 30px; border-radius: 24px; text-align: center; margin-bottom: 30px;">
                <h2 style="color: #0E4435; margin: 0; font-size: 22px; font-weight: 900;">🛒 طلبك في الطريق!</h2>
                <p style="color: #4a4a4a; font-size: 15px; margin-top: 10px; font-weight: bold;">مرحباً ${userName}، شكراً لثقتك بـ Hawsni.</p>
            </div>

            <h3 style="color: #1a1a1a; font-size: 16px; font-weight: 900; margin-bottom: 15px; border-right: 4px solid #0E4435; padding-right: 10px;">تفاصيل الطلب</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div style="background: #fdfdfd; padding: 20px; border-radius: 16px; margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #666; font-weight: bold;">إجمالي المبلغ:</span>
                    <span style="color: #0E4435; font-weight: 900; font-size: 20px; float: left;">${(order.total_amount || order.total).toLocaleString()} ج.م</span>
                </div>
                <div style="clear: both;"></div>
            </div>

            <div style="text-align: center; margin-top: 40px;">
                <a href="https://hawsni.com/track-order?id=${order.id}" style="background-color: #0E4435; color: #ffffff; padding: 18px 40px; border-radius: 50px; text-decoration: none; font-weight: 900; font-size: 16px; display: inline-block;">تتبع طلبك الآن</a>
            </div>

            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 40px; line-height: 1.6;">
                سيصلك إشعار فور شحن الطلب.<br>إذا كان لديك أي استفسار، نحن نسعد دائماً بخدمتك.
            </p>
        </div>`,
    });
}

// ──────────────────────────────────────────────
// 4. Order Status Update Email
// ──────────────────────────────────────────────
const STATUS_LABELS = {
    'Processing': { ar: 'قيد التجهيز', emoji: '📦', color: '#0E4435' },
    'Shipped': { ar: 'تم الشحن وبانتظار وصوله إليكم', emoji: '🚚', color: '#1a1a1a' },
    'Delivered': { ar: 'تم التسليم بنجاح', emoji: '✨', color: '#0E4435' },
    'Cancelled': { ar: 'تم إلغاء الطلب', emoji: '❌', color: '#ef4444' },
};

async function sendOrderStatusEmail(toEmail, userName, orderId, status) {
    const label = STATUS_LABELS[status] || { ar: status, emoji: '📦', color: '#0E4435' };

    return _send({
        to: toEmail,
        subject: `تحديث لطلبك #${orderId.toString().substring(0, 6).toUpperCase()} — Hawsni`,
        htmlContent: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 550px; margin: 0 auto; padding: 40px; border-radius: 24px; background-color: #ffffff; border: 1px solid #f0f0f0;">
             <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #0E4435; margin: 0; font-size: 28px; font-weight: 900;">Hawsni</h1>
            </div>

            <div style="text-align: center; padding: 30px; background-color: #f8faf9; border-radius: 24px; margin-bottom: 30px;">
                <div style="font-size: 48px; margin-bottom: 15px;">${label.emoji}</div>
                <h2 style="color: #1a1a1a; margin: 0; font-size: 20px; font-weight: 900;">${label.ar}</h2>
                <p style="color: #666; font-size: 14px; margin-top: 10px;">طلبك رقم #<b>${orderId.toString().toUpperCase()}</b></p>
            </div>

            <p style="color: #4a4a4a; font-size: 15px; text-align: center; line-height: 1.6; margin-bottom: 30px;">
                مرحباً ${userName}، نسعد بإعلامك بأن حالة طلبك قد تغيرت لتكون <b>${label.ar}</b>.
            </p>

            <div style="text-align: center;">
                <a href="https://hawsni.com/track-order?id=${orderId}" style="color: #0E4435; font-weight: 900; text-decoration: underline;">متابعة التفاصيل كاملة</a>
            </div>
        </div>`,
    });
}

// ──────────────────────────────────────────────
// 5. Admin Notification Email
// ──────────────────────────────────────────────
async function sendAdminNotification(subject, htmlContent) {
    return _send({
        to: ADMIN_EMAIL,
        subject: `🔔 Hawsni Admin: ${subject}`,
        htmlContent: `
        <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; background: #fff; border: 1px solid #eee; border-radius: 16px;">
            <div style="background: #0E4435; padding: 15px; border-radius: 12px; margin-bottom: 20px;">
                <h2 style="color: #fff; margin: 0; font-size: 18px;">تنبيه النظام | Hawsni Alert</h2>
            </div>
            <div style="color: #333; font-size: 15px; line-height: 1.7; text-align: right;">
                ${htmlContent}
            </div>
            <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #eee; font-size: 11px; color: #999; text-align: center;">
                Hawsni Dashboard System • ${new Date().toLocaleString('ar-EG')}
            </div>
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
