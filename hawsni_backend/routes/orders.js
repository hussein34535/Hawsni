const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/api/orderController');
const { protect, protectOptional } = require('../middleware/auth');
const supabase = require('../config/supabase');

// Get user orders
router.get('/', protect, OrderController.getUserOrders);

// Create order
router.post('/', protectOptional, OrderController.createOrder);

// Update order status (Admin)
router.put('/:id/status', protect, OrderController.updateStatus);

// Cancel order (authenticated)
router.put('/:id/cancel', protect, OrderController.cancelOrder);

// Cancel order via email link (no auth required - anyone with the link can cancel)
router.get('/:id/cancel-email', async (req, res) => {
    const { id } = req.params;
    try {
        const { data: order, error: fetchErr } = await supabase
            .from('orders')
            .select('id, status')
            .eq('id', id)
            .single();

        if (fetchErr || !order) {
            return res.status(404).send(`
                <div dir="rtl" style="font-family:'Segoe UI',sans-serif;text-align:center;padding:60px;max-width:500px;margin:auto;">
                    <div style="font-size:60px;margin-bottom:20px;">❌</div>
                    <h2 style="color:#333">الطلب غير موجود</h2>
                    <p style="color:#666">لم نتمكن من العثور على هذا الطلب.</p>
                </div>`);
        }

        if (order.status !== 'Processing') {
            const statusAr = { Shipped: 'تم الشحن', 'In Transit': 'في الطريق', Delivered: 'تم التسليم', Cancelled: 'ملغي بالفعل' };
            return res.send(`
                <div dir="rtl" style="font-family:'Segoe UI',sans-serif;text-align:center;padding:60px;max-width:500px;margin:auto;">
                    <div style="font-size:60px;margin-bottom:20px;">⚠️</div>
                    <h2 style="color:#333">تعذّر إلغاء الطلب</h2>
                    <p style="color:#666;line-height:1.8">لا يمكن إلغاء هذا الطلب لأنه في مرحلة: <b>${statusAr[order.status] || order.status}</b>.<br>
                    للمساعدة تواصل معنا على <a href="mailto:support@hwasi.com">support@hwasi.com</a></p>
                    <a href="https://hwasi.com" style="display:inline-block;margin-top:30px;background:#0E4435;color:#fff;padding:14px 35px;border-radius:50px;text-decoration:none;font-weight:700;">العودة للمتجر</a>
                </div>`);
        }

        const { error: cancelErr } = await supabase
            .from('orders')
            .update({ status: 'Cancelled' })
            .eq('id', id);

        if (cancelErr) throw cancelErr;

        // Notify admin
        const emailService = require('../services/emailService');
        emailService.sendAdminNotification(
            `❌ إلغاء طلب من العميل — #${id.substring(0, 8).toUpperCase()}`,
            `<div dir="rtl" style="font-family:sans-serif;padding:20px;">
                <h3>تم إلغاء طلب عبر رابط الإيميل</h3>
                <p><b>رقم الطلب:</b> ${id}</p>
                <p><b>الاختصار:</b> #${id.substring(0, 8).toUpperCase()}</p>
                <p style="color:#dc2626;font-weight:bold;">تم الإلغاء من قِبل العميل مباشرةً عبر رابط الإيميل.</p>
            </div>`
        ).catch(() => {});

        return res.send(`
            <div dir="rtl" style="font-family:'Segoe UI',sans-serif;text-align:center;padding:60px;max-width:500px;margin:auto;">
                <div style="font-size:64px;margin-bottom:20px;">✅</div>
                <h2 style="color:#0E4435;font-size:24px;">تم إلغاء طلبك بنجاح</h2>
                <p style="color:#666;line-height:1.9;font-size:15px;">
                    تم إلغاء الطلب رقم <b>#${id.substring(0,8).toUpperCase()}</b> بنجاح.<br>
                    لا توجد أي رسوم محتسبة عليك.<br>
                    نتمنى نكون عند حسن ظنك في المرات القادمة 🖤
                </p>
                <a href="https://hwasi.com" style="display:inline-block;margin-top:30px;background:#0E4435;color:#fff;padding:14px 35px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;">
                    تسوق من جديد
                </a>
            </div>`);
    } catch (err) {
        console.error('Cancel via email error:', err);
        return res.status(500).send(`
            <div dir="rtl" style="text-align:center;padding:60px;font-family:sans-serif;">
                <h2>حدث خطأ. حاول مرة أخرى لاحقاً.</h2>
            </div>`);
    }
});

// Get order by ID (Optional protection - must come AFTER specific routes)
router.get('/:id', protectOptional, OrderController.getOrder);

module.exports = router;