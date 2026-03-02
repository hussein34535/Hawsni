const supabase = require('../config/supabase');
const emailService = require('./emailService');
const metaService = require('./metaService');

class OrderService {
    async getAllOrders() {
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*, products(name, images))')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    async getUserOrders(userId) {
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*, products(name, images))')
            .eq('user_id', userId)
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

    async createOrder(orderData, items, guestInfo = {}) {
        // Generate unique 6-digit order number
        let orderNumber;
        let isUnique = false;
        while (!isUnique) {
            orderNumber = Math.floor(100000 + Math.random() * 900000).toString();
            const { data: existing } = await supabase
                .from('orders')
                .select('id')
                .eq('order_number', orderNumber)
                .single();
            if (!existing) isUnique = true;
        }
        orderData.order_number = orderNumber;

        // Get first item info for order summary
        const firstItem = items && items.length > 0 ? items[0] : null;
        if (firstItem) {
            const { data: firstProd } = await supabase
                .from('products')
                .select('name, images')
                .eq('id', firstItem.product || firstItem.productId || firstItem.product_id)
                .single();

            orderData.product_name = firstItem.name || firstProd?.name || 'منتج';
            orderData.product_image = (firstProd?.images && firstProd.images.length > 0) ? firstProd.images[0] : (firstItem.image_url || null);
            orderData.items_count = items.length;
        }

        // 1. Create Order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Create Order Items
        if (items && items.length > 0) {
            // First fetch missing image URLs directly from DB to prevent payload spoofing
            const productIds = items.map(item => item.product || item.productId || item.product_id);
            const { data: dbProducts } = await supabase
                .from('products')
                .select('id, images')
                .in('id', productIds);

            const orderItems = items.map(item => {
                const prodId = item.product || item.productId || item.product_id;
                const dbProduct = dbProducts?.find(p => p.id === prodId);
                const firstImage = (dbProduct?.images && dbProduct.images.length > 0) ? dbProduct.images[0] : null;

                return {
                    order_id: order.id,
                    product_id: prodId,
                    name: item.name,
                    image_url: firstImage || item.imageUrl || item.image || item.image_url || null, // Prioritize DB image
                    quantity: item.quantity,
                    price: item.price,
                    size: item.size || null,
                    color: item.color || null
                };
            });

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            order.items = orderItems;
        }

        // Send order confirmation email and admin notification (non-blocking)
        try {
            let customerEmail = guestInfo.guestEmail || null;
            let customerName = guestInfo.guestName || 'عميل';

            if (orderData.user_id) {
                const { data: user } = await supabase
                    .from('users')
                    .select('email, name')
                    .eq('id', orderData.user_id)
                    .single();
                if (user) {
                    customerEmail = user.email;
                    customerName = user.name || customerName;
                }
            }

            // Fallback to shipping address email (for guest checkout)
            if (!customerEmail && orderData.shipping_address) {
                let shipping = orderData.shipping_address;
                if (typeof shipping === 'string') {
                    try { shipping = JSON.parse(shipping); } catch (e) { }
                }
                if (shipping) {
                    customerEmail = shipping.email || customerEmail;
                    customerName = shipping.name || customerName;
                }
            }

            if (customerEmail) {
                emailService.sendOrderConfirmationEmail(customerEmail, customerName, order)
                    .catch(err => console.error('Order confirmation email failed:', err));
            }

            // Always send Ka-Ching Admin Notification 💰
            emailService.sendNewOrderAdminEmail({
                order,
                customerName,
                customerEmail,
                items: order.items || items,
                shippingAddress: orderData.shipping_address
            }).catch(err => console.error('Admin order notification failed:', err));

            // Track Purchase with Meta Conversions API (CAPI) 📊
            let shipping = orderData.shipping_address;
            if (typeof shipping === 'string') {
                try { shipping = JSON.parse(shipping); } catch (e) { }
            }

            metaService.trackPurchase(order, {
                email: customerEmail,
                phone: shipping?.phone,
                name: customerName,
                ip: guestInfo.ipAddress, // Ensure this is passed from controller
                userAgent: guestInfo.userAgent
            }).catch(err => console.error('Meta CAPI Purchase tracking failed:', err));

        } catch (emailErr) {
            console.error('Failed to handle order emails:', emailErr);
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

        // Send status update email (non-blocking)
        try {
            const { data: order } = await supabase
                .from('orders')
                .select('user_id, shipping_address')
                .eq('id', id)
                .single();

            if (order) {
                let customerEmail = null;
                let customerName = 'عميل';

                if (order.user_id) {
                    const { data: user } = await supabase
                        .from('users')
                        .select('email, name')
                        .eq('id', order.user_id)
                        .single();
                    if (user) {
                        customerEmail = user.email;
                        customerName = user.name || customerName;
                    }
                }

                // Guest fallback
                if (!customerEmail && order.shipping_address) {
                    customerEmail = order.shipping_address.email;
                    customerName = order.shipping_address.name || customerName;
                }

                if (customerEmail) {
                    emailService.sendOrderStatusEmail(customerEmail, customerName, id, status)
                        .catch(err => console.error('Order status email failed:', err));
                }
            }
        } catch (emailErr) {
            console.error('Failed to send order status email:', emailErr);
        }

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
    }

    async linkGuestOrders(userId, email, phone) {
        console.log(`🔍 Linking guest orders for User: ${userId}, Email: ${email}, Phone: ${phone}`);

        try {
            // Find orders where user_id is null AND (shipping_address->email = email OR shipping_address->phone = phone)
            // Note: shipping_address is a JSONB column

            let query = supabase
                .from('orders')
                .update({ user_id: userId })
                .is('user_id', null);

            // Using or condition for email or phone match in JSONB
            // We need to be careful with syntax for JSONB matching in Supabase JS client
            // Alternative: Fetch first, then update by IDs if complex queries are tricky

            const { data: ordersToLink, error: fetchError } = await supabase
                .from('orders')
                .select('id, shipping_address')
                .is('user_id', null);

            if (fetchError) throw fetchError;

            const idsToUpdate = ordersToLink
                .filter(order => {
                    const addr = order.shipping_address || {};
                    const matchEmail = email && addr.email && addr.email.toLowerCase() === email.toLowerCase();
                    const matchPhone = phone && addr.phone && addr.phone.toString() === phone.toString();
                    return matchEmail || matchPhone;
                })
                .map(order => order.id);

            if (idsToUpdate.length > 0) {
                const { error: updateError } = await supabase
                    .from('orders')
                    .update({ user_id: userId })
                    .in('id', idsToUpdate);

                if (updateError) throw updateError;
                console.log(`✅ Linked ${idsToUpdate.length} orders to user ${userId}`);
                return idsToUpdate.length;
            }

            return 0;
        } catch (error) {
            console.error('❌ Failed to link guest orders:', error);
            // Non-critical failure, don't block the main auth flow
            return 0;
        }
    }
}

module.exports = new OrderService();
