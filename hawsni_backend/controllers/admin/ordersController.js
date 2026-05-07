const { supabaseAdmin: supabase } = require('../../config/supabase');
const emailService = require('../../services/emailService');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class OrdersController {
    // List all orders - with pagination
    async index(req, res) {
        try {
            const { page = 1, limit = 1000 } = req.query;
            const pageNum = parseInt(page) || 1;
            const limitNum = Math.min(parseInt(limit) || 1000, 2000); // max 2000 at once
            const from = (pageNum - 1) * limitNum;
            const to = from + limitNum - 1;

            const { data: orders, error: ordersError, count } = await supabase
                .from('orders')
                .select(`
                    *,
                    users(name, phone, email),
                    order_items(
                        *,
                        products(id, name, images, price)
                    )
                `, { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            if (ordersError) throw ordersError;

            const ordersWithProducts = (orders || []).map(order => {
                try {
                    // Pre-parse shipping_address if it's a JSON string
                    if (typeof order.shipping_address === 'string' && order.shipping_address.trim().startsWith('{')) {
                        try { order.shipping_address = JSON.parse(order.shipping_address); } catch (e) { }
                    }

                    // Safety: Ensure total is a number
                    order.total = parseFloat(order.total || 0);

                    const items = order.order_items || [];
                    if (items.length > 0) {
                        const firstItem = items[0];
                        const firstProduct = firstItem.products;
                        order.product_image = firstItem.image_url || firstProduct?.images?.[0] || null;
                        order.product_name = firstProduct?.name || firstItem.name || 'منتج غير معروف';
                        order.items_count = items.length;
                        
                        order.items = items.map(item => ({
                            ...item,
                            price: parseFloat(item.price || 0)
                        }));
                    } else {
                        order.product_image = null;
                        order.product_name = 'طلب بدون منتجات';
                        order.items_count = 0;
                        order.items = [];
                    }

                    return order;
                } catch (mapErr) {
                    console.error(`Error processing order ${order?.id}:`, mapErr);
                    return { ...order, product_name: 'خطأ في معالجة الطلب', total: 0 };
                }
            });

            const totalCount = count || ordersWithProducts.length;
            res.render('orders', { 
                orders: ordersWithProducts,
                pagination: {
                    total: totalCount,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(totalCount / limitNum)
                }
            });
        } catch (err) {
            console.error('Error fetching orders:', err);
            res.status(500).send('خطأ في تحميل الطلبات: ' + err.message);
        }
    }

    // Update order status
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, skipEmail } = req.body;

            // Update and retrieve full data in ONE query
            const { data: order, error } = await supabase
                .from('orders')
                .update({ status })
                .eq('id', id)
                .select(`
                    *,
                    users(name, email),
                    order_items(
                        *,
                        products(id, name, images)
                    )
                `)
                .single();

            if (error) {
                console.error(`Status Update Error for Order ${id}:`, error);
                return res.status(500).json({ 
                    success: false, 
                    message: `خطأ في تحديث الحالة: ${error.message || 'فشل الاتصال بقاعدة البيانات'}` 
                });
            }

            // Respond to client immediately
            if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
                res.json({ success: true, message: 'تم تحديث الحالة بنجاح' });
            } else {
                res.redirect('/admin/orders');
            }

            // Send notification in background
            if (order) {
                let customerEmail = order.users?.email;
                let customerName = order.users?.name;

                if (!customerEmail) {
                    let ship = order.shipping_address;
                    if (typeof ship === 'string' && ship.trim().startsWith('{')) {
                        try { ship = JSON.parse(ship); } catch (e) { }
                    }
                    if (typeof ship === 'object' && ship !== null) {
                        customerEmail = ship.email || ship.guestEmail;
                        customerName = customerName || ship.name || ship.guestName;
                    }
                }

                if (customerEmail && skipEmail !== true && skipEmail !== 'true') {
                    emailService.sendOrderStatusEmail(customerEmail, customerName || 'عميلنا العزيز', order, status)
                        .catch(err => console.error('Background Email Error:', err));
                }
            }

        } catch (err) {
            console.error('Critical Controller Error:', err);
            res.status(500).send('خطأ تقني في معالجة طلب تحديث الحالة');
        }
    }

    // Bulk update order status
    async bulkUpdateStatus(req, res) {
        try {
            const { ids, status, skipEmail } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ success: false, message: 'لا توجد طلبات محددة' });
            }
            if (!status) {
                return res.status(400).json({ success: false, message: 'الحالة مطلوبة' });
            }

            const { data, error } = await supabase
                .from('orders')
                .update({ status })
                .in('id', ids)
                .select(`
                    *,
                    users(name, email),
                    order_items(
                        *,
                        products(id, name, images)
                    )
                `);

            if (error) throw error;

            // Send emails for bulk updates silently if not skipped
            if (data && data.length > 0 && skipEmail !== true && skipEmail !== 'true') {
                data.forEach(order => {
                    try {
                        let customerEmail = order.users?.email;
                        let customerName = order.users?.name;

                        if (!customerEmail || !customerName) {
                            let ship = order.shipping_address;
                            if (typeof ship === 'string' && ship.trim().startsWith('{')) {
                                try { ship = JSON.parse(ship); } catch (e) { }
                            }
                            if (typeof ship === 'object' && ship !== null) {
                                customerEmail = ship.email || ship.guestEmail || customerEmail;
                                customerName = ship.name || ship.guestName || customerName;
                            }
                        }

                        if (customerEmail) {
                            emailService.sendOrderStatusEmail(
                                customerEmail,
                                customerName || 'عميلنا العزيز',
                                order, // Pass the full order object
                                status
                            ).catch(err => console.error(`Failed to send status email for order ${order.id}:`, err));
                        }
                    } catch (emailErr) {
                        console.error(`Error preparing status email for order ${order.id}:`, emailErr);
                    }
                });
            }

            res.json({ success: true, message: `تم تحديث ${ids.length} طلب` });
        } catch (err) {
            console.error('Error bulk updating orders:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // Delete a single order
    async deleteOrder(req, res) {
        try {
            const { id } = req.params;
            console.log(`Backend: Deleting order ${id}...`);

            // Delete order (Order items will be deleted automatically via ON DELETE CASCADE)
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', id);

            if (error) {
                console.error(`Backend: Error deleting order ${id}:`, error);
                throw error;
            }

            console.log(`Backend: Order ${id} deleted successfully`);
            res.json({ success: true, message: 'تم حذف الطلب بنجاح' });
        } catch (err) {
            console.error('Backend: Critical error deleting order:', err);
            res.status(500).json({ success: false, message: 'خطأ في حذف الطلب: ' + err.message });
        }
    }

    // Bulk delete orders
    async bulkDelete(req, res) {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ success: false, message: 'لا توجد طلبات محددة' });
            }

            // Delete orders (CASCADE will handle order_items)
            const { error: ordersError } = await supabase
                .from('orders')
                .delete()
                .in('id', ids);

            if (ordersError) throw ordersError;

            res.json({ success: true, message: `تم حذف ${ids.length} طلب` });
        } catch (err) {
            console.error('Error bulk deleting orders:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // Send "no answer" phone call notification email
    async sendNoAnswer(req, res) {
        try {
            const { id } = req.params;

            const { data: order, error } = await supabase
                .from('orders')
                .select('*, users(name, email)')
                .eq('id', id)
                .single();

            if (error || !order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });

            let customerEmail = order.users?.email;
            let customerName = order.users?.name;

            if (!customerEmail) {
                let ship = order.shipping_address;
                if (typeof ship === 'string' && ship.trim().startsWith('{')) {
                    try { ship = JSON.parse(ship); } catch (e) { }
                }
                if (typeof ship === 'object' && ship !== null) {
                    customerEmail = ship.email || ship.guestEmail;
                    customerName = customerName || ship.name || ship.guestName;
                }
            }

            if (!customerEmail) return res.status(400).json({ success: false, message: 'لا يوجد إيميل للعميل' });

            await emailService.sendNoAnswerEmail(customerEmail, customerName || 'عميلنا العزيز', order.order_number || order.id);
            res.json({ success: true, message: 'تم إرسال الإيميل بنجاح' });
        } catch (err) {
            console.error('Error sending no-answer email:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    }
    // AI Generate Email
    async generateAIEmail(req, res) {
        try {
            const { prompt } = req.body;
            if (!prompt) return res.status(400).json({ success: false, message: 'النص مطلوب' });

            // Dynamic Key Rotation logic
            const keys = Object.keys(process.env)
                .filter(key => key.startsWith('GEMINI_API_KEY'))
                .map(key => process.env[key])
                .filter(Boolean);
            
            const selectedKey = keys[Math.floor(Math.random() * keys.length)];

            if (!selectedKey) {
                console.error("No GEMINI_API_KEY found in environment");
                return res.status(500).json({ success: false, message: 'AI API Configuration error.' });
            }

            const genAI = new GoogleGenerativeAI(selectedKey);
            const model = genAI.getGenerativeModel({ 
                model: 'gemini-1.5-flash',
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "object",
                        properties: {
                            html: { type: "string" }
                        },
                        required: ["html"]
                    }
                }
            });

            const systemInstruction = `
أنت مساعد ذكاء اصطناعي لمتجر إلكتروني يسمى Hawsni للفخامة والأزياء.
المطلوب منك تحويل النص البسيط التالي المكتوب من قبل الإدارة إلى رسالة بريد إلكتروني احترافية للعميل.

القواعد الهامة:
1. استخدم لغة عربية رسمية وراقية.
2. اجعل الرسالة قصيرة جداً ومباشرة.
3. استخدم تنسيق HTML البسيط (فقط <p> و <strong> و <ul> و <br>).
4. استخدم عملة (ج.م) وليس (ريال) لأننا في مصر.

يجب أن تكون الاستجابة بصيغة JSON تحتوي على مفتاح "html" فقط.
النص المطلوب: "${prompt}"
`;

            const result = await model.generateContent(systemInstruction);
            const responseText = result.response.text();
            
            let finalHtml = '';
            try {
                const parsed = JSON.parse(responseText);
                finalHtml = parsed.html || responseText;
            } catch (e) {
                console.error('Failed to parse AI JSON:', e);
                // Last resort fallback
                finalHtml = responseText.replace(/```json|```/g, '').trim();
            }

            return res.json({ success: true, generatedHtml: finalHtml });

        } catch (err) {
            console.error('Error in AI Generation:', err);
            res.status(500).json({ success: false, message: 'حدث خطأ أثناء توليد الرسالة: ' + err.message });
        }
    }

    // Send AI Email
    async sendAIEmail(req, res) {
        try {
            const { id } = req.params;
            const { htmlContent } = req.body;

            if (!htmlContent) return res.status(400).json({ success: false, message: 'محتوى الرسالة مطلوب' });

            const { data: order, error } = await supabase
                .from('orders')
                .select('*, users(name, email)')
                .eq('id', id)
                .single();

            if (error || !order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });

            let customerEmail = order.users?.email;
            let customerName = order.users?.name;

            if (!customerEmail) {
                let ship = order.shipping_address;
                if (typeof ship === 'string' && ship.trim().startsWith('{')) {
                    try { ship = JSON.parse(ship); } catch (e) { }
                }
                if (typeof ship === 'object' && ship !== null) {
                    customerEmail = ship.email || ship.guestEmail;
                    customerName = customerName || ship.name || ship.guestName;
                }
            }

            if (!customerEmail) return res.status(400).json({ success: false, message: 'هذا العميل لم يقم بتسجيل بريد إلكتروني، لا يمكن إرسال الرسالة.' });

            await emailService.sendCustomAIEmail(customerEmail, 'رسالة من إدارة متجر Hawsni ✨', htmlContent);
            res.json({ success: true, message: 'تم إرسال رسالة الذكاء الاصطناعي بنجاح' });
        } catch (err) {
            console.error('Error sending AI email:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // Create Bosta Shipment
    async createBostaShipment(req, res) {
        try {
            const { id } = req.params;
            const bostaService = require('../../services/bostaService');

            // Fetch the full order details from DB
            const { data: order, error } = await supabase
                .from('orders')
                .select('*, users(name, phone, email), order_items(*, products(name))')
                .eq('id', id)
                .single();

            if (error || !order) {
                console.error('Order fetch error:', error);
                return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
            }

            // Allow resending by skipping the block check

            // Extract custom options from frontend
            const { size, allowToOpenPackage } = req.body;

            // Call Bosta Service
            const result = await bostaService.createShipment(order, { size, allowToOpenPackage });

            res.json({ 
                success: true, 
                message: 'تم إنشاء الشحنة بنجاح في بوسطة',
                trackingNumber: result.trackingNumber 
            });

        } catch (err) {
            console.error('Error creating Bosta shipment:', err);
            res.status(500).json({ success: false, message: 'خطأ في إنشاء الشحنة: ' + err.message });
        }
    }
}

module.exports = new OrdersController();

