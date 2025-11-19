const supabase = require('../config/supabase');

class OrderService {
    async getAllOrders() {
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*, products(name, images))')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    async getOrderById(id) {
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*, products(name, images, price))')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    async createOrder(orderData, items) {
        // 1. Create Order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Create Order Items
        if (items && items.length > 0) {
            const orderItems = items.map(item => ({
                order_id: order.id,
                product_id: item.product,
                name: item.name,
                quantity: item.quantity,
                price: item.price
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            order.items = orderItems;
        }

        return order;
    }

    async updateOrderStatus(id, status) {
        const updateData = { status };
        if (status === 'Delivered') {
            updateData.delivered_at = new Date();
        }

        const { data, error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async cancelOrder(id) {
        const { data, error } = await supabase
            .from('orders')
            .update({ status: 'Cancelled' })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

module.exports = new OrderService();
