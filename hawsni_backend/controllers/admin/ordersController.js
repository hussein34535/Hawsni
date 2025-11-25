const supabase = require('../../config/supabase');

class OrdersController {
    // List all orders
    async index(req, res) {
        try {
            const { data: orders, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            res.render('orders', { orders: orders || [] });
        } catch (err) {
            console.error('Error fetching orders:', err);
            res.status(500).send('خطأ في تحميل الطلبات');
        }
    }
}

module.exports = new OrdersController();
