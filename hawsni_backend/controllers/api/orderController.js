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
            const { items, shippingAddress, paymentMethod, discount, couponCode, notes, guestName, guestEmail, guestPhone, guestAlternativePhone } = req.body;

            let finalShippingAddress = shippingAddress;
            if (typeof shippingAddress === 'string') {
                try {
                    finalShippingAddress = JSON.parse(shippingAddress);
                } catch (e) {
                    finalShippingAddress = { address: shippingAddress };
                }
            } else if (!shippingAddress) {
                finalShippingAddress = {};
            }

            // Ensure name and phone are stored in the address object for guest/one-time use
            if (guestName) finalShippingAddress.name = guestName;
            if (guestPhone) finalShippingAddress.phone = guestPhone;
            if (guestAlternativePhone) finalShippingAddress.alternative_phone = guestAlternativePhone;
            if (guestEmail) finalShippingAddress.email = guestEmail;

            // --- Server-side Price Security ---
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ success: false, message: 'السلة فارغة' });
            }

            const productIds = items.map(item => item.product || item.productId || item.product_id);
            const { data: dbProducts } = await supabase.from('products').select('id, price, discount').in('id', productIds);

            let safeSubtotal = 0;
            const safeItems = items.map(item => {
                let prodId = item.product || item.productId || item.product_id;
                let dbProduct = dbProducts?.find(p => p.id == prodId);
                
                if (!dbProduct) throw new Error(`Product not found: ${prodId}`);

                let basePrice = parseFloat(dbProduct.price) || 0;
                let itemDiscount = parseInt(dbProduct.discount) || 0;
                let realPrice = Math.max(0, basePrice - itemDiscount);

                safeSubtotal += realPrice * (parseInt(item.quantity) || 1);
                
                return {
                    ...item,
                    price: realPrice // Force server price
                };
            });

            const shippingFee = parseFloat(req.body.shippingFee) || 0;
            const orderDiscount = parseFloat(discount) || 0;

            const orderData = {
                user_id: req.user ? req.user.id : null,
                shipping_address: finalShippingAddress,
                payment_method: paymentMethod,
                subtotal: safeSubtotal,
                shipping_fee: shippingFee,
                discount: orderDiscount,
                coupon_code: couponCode,
                notes: notes || null,
                total: Math.max(0, safeSubtotal + shippingFee - orderDiscount),
                status: 'Processing'
            };

            const guestInfo = {
                guestName: guestName || finalShippingAddress.name,
                guestEmail: guestEmail || finalShippingAddress.email,
                guestPhone: guestPhone || finalShippingAddress.phone,
                ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                userAgent: req.headers['user-agent']
            };
            const order = await OrderService.createOrder(orderData, safeItems, guestInfo);

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
            // Fetch orders with items and product images to show thumbnails in list
            const { data: orders, error } = await supabase
                .from('orders')
                .select('*, order_items(*, products(name, images))')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Flatten slightly for the view's convenience if needed, 
            // but the view already handles complex structures in the modal.
            // Let's ensure top-level order object has product_image/name fallbacks
            const enhancedOrders = (orders || []).map(order => {
                if (order.order_items && order.order_items.length > 0) {
                    const firstItem = order.order_items[0] || {};
                    const prod = firstItem.products || {};

                    order.product_name = order.product_name || firstItem.name || prod.name || 'منتج';
                    order.items_count = order.items_count || order.order_items.length;

                    // Robust Image Logic:
                    const rowImg = order.product_image || firstItem.image_url || '';
                    const hasRealImage = rowImg && !rowImg.includes('placeholder.png');

                    if (!hasRealImage && prod.images && prod.images.length > 0) {
                        order.product_image = prod.images[0];
                    } else if (!hasRealImage) {
                        order.product_image = '/placeholder.png';
                    } else {
                        order.product_image = rowImg;
                    }
                }
                return order;
            });

            res.render('orders', { orders: enhancedOrders });
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
