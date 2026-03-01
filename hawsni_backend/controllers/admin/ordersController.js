const supabase = require('../../config/supabase');

class OrdersController {
    // List all orders
    async index(req, res) {
        try {
            // Fetch orders
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('*, users(name, phone)')
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            // For each order, fetch order items with product details
            const ordersWithProducts = await Promise.all(
                (orders || []).map(async (order) => {
                    // Pre-parse shipping_address if it's a JSON string
                    if (typeof order.shipping_address === 'string' && order.shipping_address.trim().startsWith('{')) {
                        try {
                            order.shipping_address = JSON.parse(order.shipping_address);
                        } catch (e) {
                            console.error('Error parsing shipping_address:', e);
                        }
                    }

                    const { data: items, error: itemsError } = await supabase
                        .from('order_items')
                        .select(`
                            *,
                            products (
                                id,
                                name,
                                images,
                                price
                            )
                        `)
                        .eq('order_id', order.id);

                    if (!itemsError && items && items.length > 0) {
                        // Get the first product image for the order thumbnail
                        const firstProduct = items[0].products;
                        order.product_image = firstProduct?.images?.[0] || null;
                        order.product_name = firstProduct?.name || 'منتج';
                        order.items_count = items.length;
                        order.items = items;
                    } else {
                        order.product_image = null;
                        order.product_name = 'منتج';
                        order.items_count = 0;
                        order.items = [];
                    }

                    return order;
                })
            );

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

            const { data, error } = await supabase
                .from('orders')
                .update({ status })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            res.redirect('/orders');
        } catch (err) {
            console.error('Error updating order status:', err);
            res.status(500).send('خطأ في تحديث حالة الطلب');
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

            const { error } = await supabase
                .from('orders')
                .update({ status })
                .in('id', ids);

            if (error) throw error;

            res.json({ success: true, message: `تم تحديث ${ids.length} طلب` });
        } catch (err) {
            console.error('Error bulk updating orders:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    }
}

module.exports = new OrdersController();

