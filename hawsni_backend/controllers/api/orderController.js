const supabase = require('../../config/supabase');
const OrderService = require('../../services/orderService');

class OrderController {
    // API Methods
    async getOrders(req, res) {
        try {
            const orders = await OrderService.getAllOrders();
            res.json({ success: true, orders });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getUserOrders(req, res) {
        try {
            const orders = await OrderService.getUserOrders(req.user.id);
            res.json({ success: true, orders });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getOrder(req, res) {
        try {
            const order = await OrderService.getOrderById(req.params.id);

            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            // Check ownership if not admin (assuming role check is done elsewhere or we add it here)
            // For now, just return order
            res.json({ success: true, order });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async createOrder(req, res) {
        try {
            const { items, shippingAddress, paymentMethod, subtotal, discount, couponCode, guestName, guestEmail, guestPhone } = req.body;

            const shippingFee = 5.00;
            const total = subtotal + shippingFee - discount;

            const orderData = {
                user_id: req.user ? req.user.id : null,
                shipping_address: shippingAddress,
                payment_method: paymentMethod,
                subtotal: subtotal,
                shipping_fee: shippingFee,
                discount: discount,
                coupon_code: couponCode,
                total: total,
                status: 'Processing'
            };

            const guestInfo = {
                guestName,
                guestEmail,
                guestPhone,
                ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                userAgent: req.headers['user-agent']
            };
            const order = await OrderService.createOrder(orderData, items, guestInfo);

            res.status(201).json({ success: true, order });
        } catch (error) {
            console.error('Error creating order:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateStatus(req, res) {
        try {
            const { status } = req.body;
            const order = await OrderService.updateOrderStatus(req.params.id, status);
            res.json({ success: true, updatedOrder: order });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async cancelOrder(req, res) {
        try {
            const order = await OrderService.getOrderById(req.params.id);

            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            if (order.status !== 'Processing') {
                return res.status(400).json({ success: false, message: 'Cannot cancel this order' });
            }

            const cancelledOrder = await OrderService.cancelOrder(req.params.id);
            res.json({ success: true, cancelledOrder });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Admin UI Methods
    async renderOrdersPage(req, res) {
        try {
            const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
            res.render('orders', { orders: orders || [] });
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).send(`خطأ في جلب الطلبات: ${error.message}`);
        }
    }

    async updateStatusAdmin(req, res) {
        try {
            const { status } = req.body;
            await supabase.from('orders').update({ status }).eq('id', req.params.id);
            res.redirect('/orders');
        } catch (error) {
            console.error('Error updating order status:', error);
            res.status(500).send(`خطأ في تحديث حالة الطلب: ${error.message}`);
        }
    }
}

module.exports = new OrderController();
