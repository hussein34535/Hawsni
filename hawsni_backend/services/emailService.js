const fetch = require('node-fetch');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_URL = 'https://api.resend.com/emails';
const SENDER = process.env.SENDER_EMAIL || 'Hawsni <noreply@hwasi.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hussona4635@gmail.com';

/**
 * Low-level Resend send helper.
 * @param {Object} opts – { to, subject, htmlContent }
 */
async function _send({ to, subject, htmlContent }) {
    // Sanitize the 'to' email: remove spaces and non-ASCII characters that cause 422 Error
    const sanitizedTo = typeof to === 'string'
        ? to.replace(/[^\x00-\x7F]/g, "").replace(/\s/g, "")
        : to;

    if (!sanitizedTo) {
        console.error('❌ Resend email error: Invalid or empty email address provided');
        return null;
    }

    const res = await fetch(RESEND_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: SENDER,
            to: [sanitizedTo],
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
    console.log(`✅ Email sent to ${sanitizedTo} — id: ${data.id}`);
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
// 3. Order Confirmation Email (Customer)
// ──────────────────────────────────────────────
async function sendOrderConfirmationEmail(toEmail, userName, order) {
    const orderNumber = order.order_number || String(order.id).substring(0, 6).toUpperCase();
    const total = order.total_amount || order.total || 0;
    const items = order.order_items || order.items || [];

    const itemsHtml = items.map(item => {
        const itemName = item.name || (item.products && item.products.name) || '—';
        let itemImage = item.image_url || item.imageUrl || (item.products && item.products.images && item.products.images[0]) || 'https://placehold.co/100x100/eeeeee/999999?text=?';

        // Final sanity check for placeholder
        if (itemImage === '/placeholder.png' && item.products && item.products.images && item.products.images.length > 0) {
            itemImage = item.products.images[0];
        }

        return `
        <tr>
            <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; width: 60px;">
                <img src="${itemImage}" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; border: 1px solid #eee;" alt="${itemName}">
            </td>
            <td style="padding: 14px 10px; border-bottom: 1px solid #f0f0f0;">
                <span style="font-weight: 800; color: #1a1a1a; font-size: 14px;">${itemName}</span>
                <br><span style="color: #999; font-size: 11px;">المقاس: ${item.size || 'عادي'} | الكمية: ${item.quantity}${item.color ? ' | اللون: ' + item.color : ''}</span>
            </td>
            <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; text-align: left; font-weight: 900; color: #0E4435; font-size: 14px; white-space: nowrap;">
                ${((item.price || 0) * (item.quantity || 1)).toLocaleString()} ج.م
            </td>
        </tr>
    `;
    }).join('');

    return _send({
        to: toEmail,
        subject: `✅ تم تأكيد طلبك #${orderNumber} — Hawsni`,
        htmlContent: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e8e8e8; box-shadow: 0 10px 40px rgba(0,0,0,0.06);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0E4435 0%, #1a6b54 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 900;">Hawsni</h1>
                <p style="color: rgba(255,255,255,0.6); margin: 5px 0 0 0; font-size: 12px; font-weight: 600;">الفخامة في كل تفصيلة</p>
            </div>

            <!-- Success Banner -->
            <div style="background: #f0faf5; padding: 30px; text-align: center; border-bottom: 2px solid #d4edda;">
                <div style="font-size: 44px; margin-bottom: 10px;">🎉</div>
                <h2 style="color: #0E4435; margin: 0; font-size: 22px; font-weight: 900;">تم تأكيد طلبك بنجاح!</h2>
                <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">مرحباً <b>${userName}</b>، شكراً لثقتك بـ Hawsni</p>
                <div style="margin-top: 15px;">
                    <span style="background: #0E4435; color: #fff; padding: 8px 20px; border-radius: 50px; font-size: 13px; font-weight: 800;">🧾 طلب رقم #${orderNumber}</span>
                </div>
            </div>

            <div style="padding: 30px;">
                
                <!-- Order Timeline -->
                <div style="background: #f9f9f9; border-radius: 16px; padding: 20px; margin-bottom: 25px; border: 1px solid #f0f0f0;">
                    <h3 style="margin: 0 0 15px 0; font-size: 14px; font-weight: 900; color: #1a1a1a;">📍 حالة طلبك الآن</h3>
                    <table style="width: 100%;">
                        <tr>
                            <td style="text-align: center; width: 33%;">
                                <div style="width: 36px; height: 36px; border-radius: 50%; background: #0E4435; margin: 0 auto 8px auto; display: flex; align-items: center; justify-content: center;">
                                    <span style="color: white; font-size: 16px;">✓</span>
                                </div>
                                <span style="font-size: 11px; font-weight: 800; color: #0E4435;">تم التأكيد</span>
                            </td>
                            <td style="text-align: center; width: 33%;">
                                <div style="width: 36px; height: 36px; border-radius: 50%; background: #e0e0e0; margin: 0 auto 8px auto;"></div>
                                <span style="font-size: 11px; font-weight: 700; color: #999;">جاري التجهيز</span>
                            </td>
                            <td style="text-align: center; width: 33%;">
                                <div style="width: 36px; height: 36px; border-radius: 50%; background: #e0e0e0; margin: 0 auto 8px auto;"></div>
                                <span style="font-size: 11px; font-weight: 700; color: #999;">في الطريق إليك</span>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Items -->
                <div style="margin-bottom: 25px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 14px; font-weight: 900; color: #1a1a1a;">📦 المنتجات</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        ${itemsHtml}
                    </table>
                </div>

                <!-- Total -->
                <div style="background: linear-gradient(135deg, #0E4435, #1a6b54); border-radius: 16px; padding: 20px; margin-bottom: 25px;">
                    <table style="width: 100%;">
                        <tr>
                            <td style="color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 700;">إجمالي المبلغ</td>
                            <td style="text-align: left; color: #fff; font-size: 24px; font-weight: 900;">${Number(total).toLocaleString()} <span style="font-size: 14px;">ج.م</span></td>
                        </tr>
                        <tr>
                            <td style="color: rgba(255,255,255,0.5); font-size: 12px; padding-top: 5px;">💵 الدفع عند الاستلام</td>
                            <td></td>
                        </tr>
                    </table>
                </div>

                <!-- Track Button -->
                <div style="text-align: center; margin: 25px 0;">
                    <a href="https://hwasi.com/track-order?id=${order.id}" style="background: #0E4435; color: #ffffff; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: 900; font-size: 15px; display: inline-block; box-shadow: 0 4px 15px rgba(14,68,53,0.3);">
                        📍 تتبع طلبك الآن
                    </a>
                </div>

                <!-- Cancel Section -->
                <div style="background: #fafafa; border: 1px solid #e8e8e8; border-radius: 16px; padding: 22px; margin-top: 20px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #555;">هل تريد إلغاء طلبك؟</p>
                    <p style="margin: 0 0 16px 0; font-size: 12px; color: #999; line-height: 1.6;">
                        يمكنكم إلغاء الطلب بسهولة قبل بدء تجهيزه.<br>بعد الشحن لن يكون الإلغاء متاحاً.
                    </p>
                    <a href="https://hwasibackend.vercel.app/api/orders/${order.id}/cancel-email"
                        style="display: inline-block; background: #fff; color: #dc2626; border: 1.5px solid #dc2626; padding: 11px 28px; border-radius: 50px; font-size: 13px; font-weight: 800; text-decoration: none;">
                        ❌ إلغاء الطلب
                    </a>
                </div>

                <p style="color: #aaa; font-size: 12px; text-align: center; line-height: 1.7; margin-top: 20px;">
                    هنبعتلك إشعار فور شحن الطلب 🚚<br>لو عندك أي سؤال، إحنا هنا دايماً
                </p>
            </div>

            <!-- Footer -->
            <div style="background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #0E4435; font-size: 13px; font-weight: 900; margin: 0;">Hawsni — Premium Fashion ✨</p>
            </div>
        </div>`
    });
}

// ──────────────────────────────────────────────
// 4. Order Status Update Email (Customer)
// ──────────────────────────────────────────────
const STATUS_CONFIG = {
    'Processing': {
        ar: 'جاري تجهيز طلبك',
        emoji: '📦',
        color: '#0E4435',
        icon: '⚙️',
        message: 'فريقنا شغال على تجهيز طلبك بأفضل جودة. هنبعتلك إشعار فور الشحن!',
        step: 1
    },
    'Shipped': {
        ar: 'طلبك مع شركة الشحن الآن!',
        emoji: '🚚',
        color: '#2563eb',
        icon: '🚀',
        message: 'تم تسليم طلبكم إلى شركة الشحن وهو في طريقه إليكم. ستتواصل معكم شركة الشحن قريباً لتحديد موعد التسليم.',
        step: 2
    },
    'In Transit': {
        ar: 'المندوب في طريقه إليك!',
        emoji: '🏍️',
        color: '#f59e0b',
        icon: '📍',
        message: 'المندوب قريب منك! خلي موبايلك معاك عشان يقدر يوصلك.',
        step: 2
    },
    'Delivered': {
        ar: 'تم التسليم بنجاح!',
        emoji: '🎉',
        color: '#16a34a',
        icon: '✨',
        message: 'طلبك وصلك! نتمنى يعجبك. رأيك يهمنا — شاركنا تقييمك 🌟',
        step: 3
    },
    'Cancelled': {
        ar: 'تم إلغاء الطلب',
        emoji: '❌',
        color: '#ef4444',
        icon: '⚠️',
        message: 'تم إلغاء طلبك. لو عندك أي استفسار أو أردت إعادة الطلب، تواصل معنا على إنستغرام.',
        step: 0
    },
};

async function sendOrderStatusEmail(toEmail, userName, order, status) {
    const config = STATUS_CONFIG[status] || { ar: status, emoji: '📦', color: '#0E4435', icon: '📦', message: '', step: 0 };
    const orderId = typeof order === 'object' ? order.id : order;
    const orderNumber = String(orderId).substring(0, 6).toUpperCase();
    const items = (typeof order === 'object' && order.order_items) ? order.order_items : [];

    // Build progress steps
    const steps = ['تم التأكيد', 'جاري التجهيز / الشحن', 'تم التسليم'];
    const stepsHtml = steps.map((label, i) => {
        const isActive = i < config.step;
        const isCurrent = i === config.step - 1;
        const bg = isActive || isCurrent ? config.color : '#e0e0e0';
        const textColor = isActive || isCurrent ? config.color : '#999';
        return `
            <td style="text-align: center; width: 33%;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: ${bg}; margin: 0 auto 6px auto; display: flex; align-items: center; justify-content: center;">
                    ${isActive || isCurrent ? '<span style="color: white; font-size: 14px;">✓</span>' : ''}
                </div>
                <span style="font-size: 10px; font-weight: 800; color: ${textColor};">${label}</span>
            </td>
        `;
    }).join('');

    // Build review section (shown at top for Delivered orders)
    let reviewSection = '';
    if (status === 'Delivered' && items.length > 0) {
        const itemsListHtml = items.map(item => {
            const productId = item.product_id || (item.products && item.products.id);
            const itemName = item.name || (item.products && item.products.name) || 'منتج';
            let itemImage = item.image_url || (item.products && item.products.images && item.products.images[0]) || 'https://hwasi.com/logo.png';

            return `
                <div style="background: #fff; border: 1px solid #e8e8e8; border-radius: 16px; padding: 16px; margin-bottom: 12px; display: flex; align-items: center; gap: 14px;">
                    <img src="${itemImage}" style="width: 60px; height: 60px; border-radius: 12px; object-fit: cover; flex-shrink: 0;" alt="${itemName}">
                    <div style="flex: 1; text-align: right;">
                        <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 800; color: #1a1a1a;">${itemName}</p>
                        <div style="font-size: 18px; margin-bottom: 8px;">⭐⭐⭐⭐⭐</div>
                        <a href="https://hwasi.com/product/${productId}#reviews"
                            style="display: inline-block; background: #0E4435; color: #fff; padding: 9px 20px; border-radius: 50px; font-size: 12px; font-weight: 900; text-decoration: none;">
                            قيّم هذا المنتج الآن
                        </a>
                    </div>
                </div>
            `;
        }).join('');

        reviewSection = `
            <div style="background: linear-gradient(135deg, #f0faf5, #e6f7f0); border: 2px solid #0E4435; border-radius: 20px; padding: 30px; margin-bottom: 25px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <span style="font-size: 40px; display: block; margin-bottom: 10px;">✨</span>
                    <h3 style="margin: 0 0 8px 0; font-size: 20px; color: #0E4435; font-weight: 900;">شكراً لثقتكم في هَوَسي</h3>
                    <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.7;">
                        وصل طلبكم بسلام! رأيكم يهمنا ويساعد بقية العملاء.<br>
                        <b>دقيقة واحدة فقط لمشاركة تجربتكم:</b>
                    </p>
                </div>
                ${itemsListHtml}
            </div>
        `;
    }

    return _send({
        to: toEmail,
        subject: `${config.emoji} ${config.ar} — طلب #${orderNumber} — Hawsni`,
        htmlContent: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e8e8e8; box-shadow: 0 10px 40px rgba(0,0,0,0.06);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0E4435, #1a6b54); padding: 25px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 900;">Hawsni</h1>
            </div>

            <!-- Status Banner -->
            <div style="background: ${config.color}10; padding: 35px; text-align: center; border-bottom: 3px solid ${config.color};">
                <div style="font-size: 56px; margin-bottom: 10px;">${config.emoji}</div>
                <h2 style="color: ${config.color}; margin: 0; font-size: 22px; font-weight: 900;">${config.ar}</h2>
                <p style="color: #888; font-size: 13px; margin: 8px 0 0 0;">طلب رقم <b>#${orderNumber}</b></p>
            </div>

            <div style="padding: 30px;">
                
                <!-- Greeting + Message -->
                <p style="color: #333; font-size: 15px; line-height: 1.7; margin: 0 0 25px 0; text-align: center;">
                    مرحباً <b>${userName}</b> 👋<br>
                    <span style="color: #666;">${config.message}</span>
                </p>

                <!-- Review Section (prominent, shown first for Delivered) -->
                ${reviewSection}

                ${status !== 'Cancelled' ? `
                <!-- Progress Bar -->
                <div style="background: #f9f9f9; border-radius: 16px; padding: 20px; margin-bottom: 25px; border: 1px solid #f0f0f0;">
                    <table style="width: 100%;">
                        <tr>${stepsHtml}</tr>
                    </table>
                </div>
                ` : ''}

                ${(status === 'Shipped' || status === 'In Transit') ? `
                <!-- Shipping Info Box -->
                <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 16px; padding: 22px; margin-bottom: 20px;">
                    <p style="margin: 0 0 14px 0; font-size: 14px; font-weight: 900; color: #1e40af;">📋 ماذا يحدث الآن؟</p>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; align-items: flex-start; gap: 10px;">
                            <span style="font-size: 16px; flex-shrink: 0;">1️⃣</span>
                            <p style="margin: 0; font-size: 13px; color: #1e3a8a; line-height: 1.6;">طلبكم تم تسليمه لشركة الشحن وهو في طريقه إليكم.</p>
                        </div>
                        <div style="display: flex; align-items: flex-start; gap: 10px;">
                            <span style="font-size: 16px; flex-shrink: 0;">2️⃣</span>
                            <p style="margin: 0; font-size: 13px; color: #1e3a8a; line-height: 1.6;">ستتواصل معكم شركة الشحن قريباً لتحديد موعد التسليم — نرجو إبقاء الهاتف متاحاً.</p>
                        </div>
                        <div style="display: flex; align-items: flex-start; gap: 10px;">
                            <span style="font-size: 16px; flex-shrink: 0;">3️⃣</span>
                            <p style="margin: 0; font-size: 13px; color: #1e3a8a; line-height: 1.6;">الدفع عند الاستلام — لا تدفع أي مبلغ مسبقاً لأي شخص.</p>
                        </div>
                    </div>
                </div>
                <!-- Track Button -->
                <div style="text-align: center; margin: 20px 0;">
                    <a href="https://hwasi.com/track-order?id=${orderId}" style="background: ${config.color}; color: #ffffff; padding: 14px 35px; border-radius: 50px; text-decoration: none; font-weight: 900; font-size: 14px; display: inline-block; box-shadow: 0 4px 15px ${config.color}40;">
                        📍 تتبع طلبك
                    </a>
                </div>
                ` : ''}

                ${status === 'Cancelled' ? `
                <!-- Instagram Contact -->
                <div style="background: linear-gradient(135deg, #fdf2f8, #fce7f3); border: 1px solid #f9a8d4; border-radius: 16px; padding: 22px; text-align: center; margin-top: 20px;">
                    <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 900; color: #9d174d;">لو عندك أي استفسار، إحنا هنا</p>
                    <p style="margin: 0 0 16px 0; font-size: 13px; color: #be185d; line-height: 1.6;">تواصل معنا على إنستغرام وهنرد عليك في أسرع وقت.</p>
                    <a href="https://www.instagram.com/hwasi_eg" target="_blank"
                        style="display: inline-flex; align-items: center; gap: 8px; background: #e1306c; color: #fff; padding: 12px 28px; border-radius: 50px; font-size: 14px; font-weight: 900; text-decoration: none;">
                        📸 تواصل عبر إنستغرام @hwasi_eg
                    </a>
                </div>
                ` : ''}
            </div>

            <!-- Footer -->
            <div style="background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #0E4435; font-size: 13px; font-weight: 900; margin: 0 0 5px 0;">Hawsni — Premium Fashion ✨</p>
                <p style="color: #bbb; font-size: 11px; margin: 0;">لو محتاج مساعدة، إحنا هنا دايماً</p>
            </div>
        </div>`
    });
}

// ──────────────────────────────────────────────
// 5. Admin Notification Email (generic)
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

// ──────────────────────────────────────────────
// 6. Ka-Ching! New Order Admin Email 💰
// ──────────────────────────────────────────────
async function sendNewOrderAdminEmail({ order, customerName, customerEmail, items, shippingAddress }) {
    const orderNumber = order.order_number || String(order.id).substring(0, 6).toUpperCase();
    const total = order.total || order.total_amount || 0;
    const itemCount = (items || []).length;
    const now = new Date();
    const timeStr = now.toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Build items rows
    const itemsHtml = (items || []).map(item => {
        const itemName = item.name || '—';
        let itemImage = item.image_url || item.imageUrl || (item.products && item.products.images && item.products.images[0]) || 'https://placehold.co/100x100/eeeeee/999999?text=?';

        // Final sanity check for placeholder
        if (itemImage === '/placeholder.png' && item.products && item.products.images && item.products.images.length > 0) {
            itemImage = item.products.images[0];
        }

        return `
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; width: 50px;">
                <img src="${itemImage}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 1px solid #eee;" alt="${itemName}">
            </td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #f5f5f5;">
                <span style="font-weight: 800; color: #1a1a1a; font-size: 14px;">${itemName}</span>
                <br><span style="color: #999; font-size: 11px;">الكمية: ${item.quantity} ${item.size ? '| المقاس: ' + item.size : ''} ${item.color ? '| اللون: ' + item.color : ''}</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; text-align: left; font-weight: 900; color: #0E4435; font-size: 14px; white-space: nowrap;">
                ${((item.price || 0) * (item.quantity || 1)).toLocaleString()} ج.م
            </td>
        </tr>
    `;
    }).join('');

    // Parse shipping address
    let address = shippingAddress;
    if (typeof address === 'string') {
        try { address = JSON.parse(address); } catch (e) { address = {}; }
    }
    address = address || {};

    return _send({
        to: ADMIN_EMAIL,
        subject: `💰 طلب جديد #${orderNumber} — ${Number(total).toLocaleString()} ج.م`,
        htmlContent: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e8e8e8; box-shadow: 0 20px 60px rgba(0,0,0,0.08);">
            
            <!-- Header: Banner -->
            <div style="background: linear-gradient(135deg, #0E4435 0%, #1a6b54 50%, #0E4435 100%); padding: 40px 30px; text-align: center; position: relative;">
                <div style="font-size: 50px; margin-bottom: 8px;">🛒</div>
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 2px;">طلب من ${customerName || 'عميل'}!</h1>
                <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0 0; font-size: 14px; font-weight: 600;">لديك طلب جديد ينتظر المراجعة</p>
            </div>

            <!-- Big Money Amount -->
            <div style="background: #f8fdf9; padding: 30px; text-align: center; border-bottom: 2px solid #0E4435;">
                <p style="color: #666; font-size: 13px; margin: 0 0 8px 0; font-weight: 700;">إجمالي الطلب</p>
                <div style="font-size: 48px; font-weight: 900; color: #0E4435; letter-spacing: -1px; line-height: 1;">
                    ${Number(total).toLocaleString()}
                    <span style="font-size: 20px; color: #1a6b54;"> ج.م</span>
                </div>
                <div style="margin-top: 15px; display: inline-block;">
                    <span style="background: #0E4435; color: #fff; padding: 6px 16px; border-radius: 50px; font-size: 12px; font-weight: 800;">
                        🧾 طلب #${orderNumber}
                    </span>
                </div>
            </div>

            <div style="padding: 30px;">
                
                <!-- Customer Info -->
                <div style="background: #f9f9f9; border-radius: 16px; padding: 20px; margin-bottom: 25px; border: 1px solid #f0f0f0;">
                    <div style="display: flex; align-items: center; margin-bottom: 12px;">
                        <span style="font-size: 18px; margin-left: 8px;">👤</span>
                        <h3 style="margin: 0; font-size: 15px; font-weight: 900; color: #1a1a1a;">بيانات العميل</h3>
                    </div>
                    <table style="width: 100%; font-size: 14px; color: #444;">
                        <tr>
                            <td style="padding: 5px 0; font-weight: 700; color: #999; width: 80px;">الاسم</td>
                            <td style="padding: 5px 0; font-weight: 800;">${customerName || '—'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-weight: 700; color: #999;">الإيميل</td>
                            <td style="padding: 5px 0; font-weight: 600;">${customerEmail || 'زائر'}</td>
                        </tr>
                        ${address.phone ? `<tr>
                            <td style="padding: 5px 0; font-weight: 700; color: #999;">الهاتف</td>
                            <td style="padding: 5px 0; font-weight: 800; direction: ltr; text-align: right;">${address.phone}</td>
                        </tr>` : ''}
                    </table>
                </div>

                <!-- Order Items -->
                <div style="margin-bottom: 25px;">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                        <span style="font-size: 18px; margin-left: 8px;">📦</span>
                        <h3 style="margin: 0; font-size: 15px; font-weight: 900; color: #1a1a1a;">المنتجات (${itemCount})</h3>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        ${itemsHtml || '<tr><td style="color: #999; padding: 10px 0;">لا توجد تفاصيل</td></tr>'}
                    </table>
                </div>

                <!-- Shipping Address -->
                ${address.address || address.city ? `
                <div style="background: #f9f9f9; border-radius: 16px; padding: 20px; margin-bottom: 25px; border: 1px solid #f0f0f0;">
                    <div style="display: flex; align-items: center; margin-bottom: 12px;">
                        <span style="font-size: 18px; margin-left: 8px;">📍</span>
                        <h3 style="margin: 0; font-size: 15px; font-weight: 900; color: #1a1a1a;">عنوان التوصيل</h3>
                    </div>
                    <p style="color: #444; font-size: 14px; line-height: 1.7; margin: 0; font-weight: 600;">
                        ${address.address || ''}${address.area ? '، ' + address.area : ''}${address.city ? '، ' + address.city : ''}${address.governorate ? '، ' + address.governorate : ''}
                    </p>
                </div>
                ` : ''}

                <!-- Payment Info -->
                <div style="background: linear-gradient(135deg, #0E4435, #1a6b54); border-radius: 16px; padding: 20px; text-align: center;">
                    <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0 0 5px 0; font-weight: 700;">طريقة الدفع</p>
                    <p style="color: #fff; font-size: 16px; font-weight: 900; margin: 0;">💵 الدفع عند الاستلام</p>
                </div>
            </div>

            <!-- Footer -->
            <div style="background: #f5f5f5; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #0E4435; font-size: 13px; font-weight: 900; margin: 0 0 5px 0;">Hawsni — Premium Fashion ✨</p> 
                <p style="color: #aaa; font-size: 11px; margin: 0;">${dateStr} • ${timeStr}</p>
            </div>
        </div>`
    });
}

// ──────────────────────────────────────────────
// 7. No Answer Phone Call Email
// ──────────────────────────────────────────────
async function sendNoAnswerEmail(toEmail, userName, orderNumber) {
    const shortOrder = String(orderNumber).substring(0, 8).toUpperCase();
    return _send({
        to: toEmail,
        subject: `📞 تنبيه بشأن طلبك #${shortOrder} — Hawsni`,
        htmlContent: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e8e8e8; box-shadow: 0 10px 40px rgba(0,0,0,0.06);">

            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0E4435 0%, #1a6b54 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 900;">Hawsni</h1>
                <p style="color: rgba(255,255,255,0.6); margin: 5px 0 0 0; font-size: 12px; font-weight: 600;">الفخامة في كل تفصيلة</p>
            </div>

            <!-- Icon Banner -->
            <div style="background: #fff8f0; padding: 35px 30px 25px; text-align: center; border-bottom: 2px solid #fed7aa;">
                <div style="font-size: 52px; margin-bottom: 12px;">📞</div>
                <h2 style="color: #c2410c; margin: 0 0 8px 0; font-size: 20px; font-weight: 900;">حاولنا التواصل معكم هاتفياً</h2>
                <span style="background: #fed7aa; color: #9a3412; padding: 5px 16px; border-radius: 50px; font-size: 12px; font-weight: 800;">طلب #${shortOrder}</span>
            </div>

            <div style="padding: 32px 30px;">

                <p style="color: #333; font-size: 15px; line-height: 1.8; margin: 0 0 22px 0;">
                    عزيزنا <b>${userName}</b>،
                </p>

                <div style="background: #fafafa; border-right: 4px solid #0E4435; border-radius: 0 16px 16px 0; padding: 20px; margin-bottom: 22px;">
                    <p style="color: #333; font-size: 14px; line-height: 1.9; margin: 0;">
                        تواصل معكم فريقنا هاتفياً للتأكد من بعض تفاصيل طلبكم وضمان وصوله بأفضل صورة ممكنة،
                        إلا أننا لم نتمكن من إتمام المكالمة في الوقت الحالي.<br><br>
                        <b>نرجو إبقاء هاتفكم متاحاً</b> كي نتمكن من خدمتكم على أكمل وجه.
                    </p>
                </div>

                <!-- Warning Box -->
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; padding: 18px; margin-bottom: 25px; text-align: center;">
                    <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.7; font-weight: 700;">
                        ⚠️ عدم الاستجابة لمحاولات التواصل قد يؤدي إلى إلغاء الطلب تلقائياً.
                    </p>
                </div>

                <p style="color: #888; font-size: 13px; line-height: 1.8; text-align: center; margin: 0;">
                    نحن نسعى دائماً لتقديم أفضل تجربة شراء لكم.<br>
                    شكراً لتفهمكم وتعاونكم 🖤
                </p>
            </div>

            <!-- Footer -->
            <div style="background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #0E4435; font-size: 13px; font-weight: 900; margin: 0;">Hawsni — Premium Fashion ✨</p>
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
    sendNewOrderAdminEmail,
    sendNoAnswerEmail,
};
