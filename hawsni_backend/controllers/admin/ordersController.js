const supabase = require('../../config/supabase');

class OrdersController {
    // List all orders
    async index(req, res) {
        try {
            // Fetch orders
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            // For each order, fetch order items with product details
            const ordersWithProducts = await Promise.all(
                (orders || []).map(async (order) => {
                    const { data: items, error: itemsError } = await supabase
                        .from('order_items')
                        .select(`
                            *,
                            products (
                                id,
                                name,
                                images
                            )
                        `)
                        .eq('order_id', order.id);

                    if (!itemsError && items && items.length > 0) {
                        // Get the first product image for the order
                        const firstProduct = items[0].products;
                        order.product_image = firstProduct?.images?.[0] || null;
                        order.product_name = firstProduct?.name || 'منتج';
                        order.items_count = items.length;
                    } else {
                        order.product_image = null;
                        order.product_name = 'منتج';
                        order.items_count = 0;
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
}

module.exports = new OrdersController();
