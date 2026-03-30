const supabase = require('../../config/supabase');
const emailService = require('../../services/emailService');

class OrdersController {
    // List all orders - single query with join (no N+1 problem)
    async index(req, res) {
        try {
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select(`
                    *,
                    users(name, phone, email),
                    order_items(
                        *,
                        products(id, name, images, price)
                    )
                `)
                .order('created_at', { ascending: false });

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
                        
                        // Ensure all item prices are numbers
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

            res.render('orders', { orders: ordersWithProducts });
        } catch (err) {
            console.error('Error fetching orders:', err);
            res.status(500).send('خطأ في تحميل الطلبات');
        }
    }

    // Update order status
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

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
                res.redirect('/orders');
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

                if (customerEmail) {
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
            const { ids, status } = req.body;
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

            // Send emails for bulk updates silently
            if (data && data.length > 0) {
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
            console.log(`Backend: Received request to delete order ${id}`);

            // Delete order items first (or rely on Cascade)
            console.log(`Backend: Deleting order items for order ${id}...`);
            const { error: itemsError } = await supabase
                .from('order_items')
                .delete()
                .eq('order_id', id);

            if (itemsError) {
                console.error(`Backend: Error deleting items for order ${id}:`, itemsError);
                throw itemsError;
            }
            console.log(`Backend: Order items deleted successfully for order ${id}`);

            // Delete order
            console.log(`Backend: Deleting order ${id}...`);
            const { error: orderError } = await supabase
                .from('orders')
                .delete()
                .eq('id', id);

            if (orderError) {
                console.error(`Backend: Error deleting order ${id}:`, orderError);
                throw orderError;
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

            // Delete order items first
            const { error: itemsError } = await supabase
                .from('order_items')
                .delete()
                .in('order_id', ids);

            if (itemsError) throw itemsError;

            // Delete orders
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

            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                console.error("GEMINI_API_KEY is not defined in .env");
                return res.status(500).json({ success: false, message: 'Gemini API Key is missing in environment variables.' });
            }
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const systemInstruction = `
أنت مساعد ذكاء اصطناعي لمتجر إلكتروني يسمى Hawsni للفخامة والأزياء.
المطلوب منك تحويل النص البسيط التالي المكتوب من قبل الإدارة إلى رسالة بريد إلكتروني احترافية للعميل.

القواعد الهامة لكتابة الإيميل:
1. استخدم لغة عربية رسمية، ودودة وراقية تناسب متجر فخامة.
2. اجعل الرسالة **قصيرة جداً ومباشرة في صلب الموضوع** بدون مقدمات أو حشو أو أسطر طويلة جداً. كُن واضحاً ومختصراً.
3. استخدم تنسيق HTML البسيط (فقط <p> و <strong> و <ul> و <br>) بدون <html> ولا <body> ولا \`\`\`html من حولها.
4. اعطني فقط النص النهائي الذي سيصل للعميل كـ HTML، ولا تضف أي رد خارجي أو شروحات.

النص المطلوب تحويله للإيميل:
"${prompt}"
`;
            const result = await model.generateContent(systemInstruction);
            let responseText = result.response.text();
            
            // Remove markdown codeblock around HTML if it exists
            responseText = responseText.replace(/```html/g, '').replace(/```/g, '').trim();

            res.json({ success: true, generatedHtml: responseText });
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
}

module.exports = new OrdersController();

