const { supabaseAdmin: supabase } = require('../config/supabase');
const emailService = require('./emailService');
const metaService = require('./metaService');
const whatsappService = require('./whatsappService');

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
        if (!id) return null;
        
        let query = supabase
            .from('orders')
            .select('*, order_items(*, products(name, images, price))');

        // Check if id is a UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        if (isUUID) {
            query = query.eq('id', id);
        } else {
            // Assume it's a 6-digit order_number or the short ID part
            query = query.eq('order_number', id);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;
        return data;
    }

    async updateOrder(id, orderData) {
        const { error } = await supabase
            .from('orders')
            .update(orderData)
            .eq('id', id);

        if (error) throw error;
        return this.getOrderById(id);
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
                .select('id, images, cost_price')
                .in('id', productIds);

            const orderItems = await Promise.all(items.map(async (item) => {
                let prodId = item.product || item.productId || item.product_id;
                let dbProduct = dbProducts?.find(p => p.id === prodId);

                // Fallback: If prodId is missing or not found in DB, try finding by name
                if (!dbProduct && item.name) {
                    const { data: namedProduct } = await supabase
                        .from('products')
                        .select('id, images')
                        .eq('name', item.name)
                        .maybeSingle();

                    if (namedProduct) {
                        dbProduct = namedProduct;
                        prodId = namedProduct.id;
                    }
                }

                const passedImage = item.image_url || item.imageUrl || item.image || null;
                const firstImage = (dbProduct?.images && dbProduct.images.length > 0) ? dbProduct.images[0] : null;

                // Use passed image if it's not null and not a placeholder, otherwise fallback to first gallery image
                const finalImage = (passedImage && !passedImage.includes('placeholder.png'))
                    ? passedImage
                    : (firstImage || passedImage || null);

                return {
                    order_id: order.id,
                    product_id: prodId,
                    name: item.name,
                    image_url: finalImage,
                    quantity: Math.round(item.quantity || 1), // Force Integer
                    price: Math.round((item.price || 0) * 100) / 100,
                    cost_price: Math.round((parseFloat(dbProduct?.cost_price) || 0) * 100) / 100,
                    size: item.size || null,
                    color: item.color || null,
                    accessories: item.accessories || null
                };
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            order.items = orderItems;

            // ⚠️ 3. Decrement Stock & Send Alerts 
            for (const item of orderItems) {
                try {
                    const qty = item.quantity || 1;
                    const pid = item.product_id;
                    const size = item.size || null;
                    const color = item.color || null;

                    let pName = 'منتج غير معروف';

                    // 1. Decrement overall stock in products with Optimistic Locking
                    let stockUpdated = false;
                    let retries = 3;
                    let currentProduct = null;

                    while (!stockUpdated && retries > 0) {
                        const { data: pData } = await supabase.from('products').select('name, stock').eq('id', pid).single();
                        currentProduct = pData;
                        
                        if (currentProduct) {
                            pName = currentProduct.name;
                            const qtyInt = Math.round(qty);
                            const newStock = Math.max(0, (parseInt(currentProduct.stock) || 0) - qtyInt);
                            
                            const { data: updatedProduct } = await supabase
                                .from('products')
                                .update({ stock: newStock })
                                .eq('id', pid)
                                .eq('stock', currentProduct.stock) // ONLY if stock hasn't changed
                                .select('id');
                                
                            if (updatedProduct && updatedProduct.length > 0) {
                                stockUpdated = true;
                            } else {
                                retries--;
                            }
                        } else {
                            break; // Product not found
                        }
                    }

                    // 2. Decrement Specific Variant Stock with Optimistic Locking
                    let variantQuery = supabase.from('product_variants').select('*').eq('product_id', pid);
                    
                    if (size) variantQuery = variantQuery.eq('size', size);
                    else variantQuery = variantQuery.is('size', null);
                    
                    if (color) variantQuery = variantQuery.eq('color', color);
                    else variantQuery = variantQuery.is('color', null);

                    const { data: variant } = await variantQuery.maybeSingle();

                    if (variant) {
                        let variantUpdated = false;
                        let varRetries = 3;
                        let newVariantStock = 0;

                        while (!variantUpdated && varRetries > 0) {
                            const currentVarStock = varRetries === 3 ? variant.stock : (await variantQuery.maybeSingle()).data?.stock;
                            if (currentVarStock === undefined) break;

                            newVariantStock = Math.max(0, (currentVarStock || 0) - qty);
                            
                            const { data: updatedVar } = await supabase
                                .from('product_variants')
                                .update({ stock: newVariantStock })
                                .eq('id', variant.id)
                                .eq('stock', currentVarStock) // ONLY if stock hasn't changed
                                .select('id');
                                
                            if (updatedVar && updatedVar.length > 0) {
                                variantUpdated = true;
                            } else {
                                varRetries--;
                            }
                        }

                        if (variantUpdated && newVariantStock <= 0) {
                            emailService.sendOutOfStockAlert(pName, variant.sku, variant.size, variant.color).catch(e => console.error(e));
                        }
                    } else if (stockUpdated && currentProduct && Math.max(0, (currentProduct.stock || 0) - qty) <= 0) {
                        // Global out of stock alert if no variants are tracked for this item
                        emailService.sendOutOfStockAlert(pName, 'غير مسجل', size, color).catch(e => console.error(e));
                    }

                } catch (stockErr) {
                    console.error('❌ Error decrementing stock for item:', stockErr);
                }
            }
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
                customerEmail: customerEmail || guestInfo.guestEmail,
                items: order.items || items,
                shippingAddress: orderData.shipping_address
            }).catch(err => console.error('Admin order notification failed:', err));

            // Track Purchase with Meta Conversions API (CAPI) 📊
            let shipping = orderData.shipping_address;
            if (typeof shipping === 'string') {
                try { shipping = JSON.parse(shipping); } catch (e) { }
            }

            metaService.trackPurchase(order, {
                email: customerEmail || guestInfo.guestEmail,
                phone: shipping?.phone || guestInfo.guestPhone,
                name: customerName || guestInfo.guestName,
                ip: guestInfo.ipAddress,
                userAgent: guestInfo.userAgent,
                eventId: guestInfo.conversionEventId, // For Browser Pixel deduplication
            }).catch(err => console.error('Meta CAPI Purchase tracking failed:', err));

            // 🟢 Send WhatsApp Confirmation 📱
            if (shipping?.phone || guestInfo.guestPhone) {
                whatsappService.sendOrderConfirmation(
                    shipping?.phone || guestInfo.guestPhone,
                    customerName,
                    order,
                    order.items || items
                ).catch(err => console.error('WhatsApp notification failed:', err));
            }

        } catch (emailErr) {
            console.error('Failed to handle order emails:', emailErr);
        }

        return order;
    }

    async updateOrderStatus(id, status) {
        // Fetch current order to check previous status
        const { data: currentOrder, error: fetchErr } = await supabase
            .from('orders')
            .select('status')
            .eq('id', id)
            .single();

        if (fetchErr) throw fetchErr;

        // If changing to Cancelled and it wasn't Cancelled before, restore stock
        if (status === 'Cancelled' && currentOrder.status !== 'Cancelled') {
            await this.restoreOrderStock(id);
        }

        const updateData = { status };
        if (status === 'Delivered') {
            updateData.delivered_at = new Date();
        }

        const { data, error } = await supabase
            .from('orders')
            .update(updateData)
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

        if (error) throw error;

        // Send status update email (non-blocking)
        try {
            if (data) {
                let customerEmail = data.users?.email || null;
                let customerName = data.users?.name || 'عميل';

                // Guest fallback
                if (!customerEmail && data.shipping_address) {
                    let shipping = data.shipping_address;
                    if (typeof shipping === 'string') {
                        try { shipping = JSON.parse(shipping); } catch (e) { }
                    }
                    customerEmail = shipping?.email || null;
                    customerName = shipping?.name || customerName;
                }

                if (customerEmail) {
                    emailService.sendOrderStatusEmail(customerEmail, customerName, data, status)
                        .catch(err => console.error('Order status email failed:', err));
                }
            }
        } catch (emailErr) {
            console.error('Failed to send order status email:', emailErr);
        }

        return data;
    }

    async restoreOrderStock(orderId) {
        try {
            const { data: order } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .eq('id', orderId)
                .single();
                
            if (!order || !order.order_items) return;
            
            for (const item of order.order_items) {
                const qty = item.quantity || 1;
                const pid = item.product_id;
                const size = item.size || null;
                const color = item.color || null;
                
                // 1. Increment overall product stock
                const { data: pData } = await supabase.from('products').select('stock').eq('id', pid).single();
                if (pData) {
                    await supabase.from('products').update({ stock: (parseInt(pData.stock) || 0) + qty }).eq('id', pid);
                }
                
                // 2. Increment variant stock
                let variantQuery = supabase.from('product_variants').select('id, stock').eq('product_id', pid);
                if (size) variantQuery = variantQuery.eq('size', size);
                else variantQuery = variantQuery.is('size', null);
                
                if (color) variantQuery = variantQuery.eq('color', color);
                else variantQuery = variantQuery.is('color', null);
                
                const { data: variant } = await variantQuery.maybeSingle();
                if (variant) {
                    await supabase.from('product_variants').update({ stock: (parseInt(variant.stock) || 0) + qty }).eq('id', variant.id);
                }
            }
        } catch (error) {
            console.error('❌ Error restoring stock for order:', error);
        }
    }

    async cancelOrder(id) {
        await this.updateOrderStatus(id, 'Cancelled');
    }

    async linkGuestOrders(userId, email, phone) {
        console.log(`🔍 Linking guest orders for User: ${userId}`);

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

    async getLatestActiveOrderByPhone(phone) {
        try {
            // Normalize phone for comparison (remove +20, spaces, etc.)
            const cleanPhone = phone.replace(/\s+/g, '').replace(/^\+20/, '0');
            const cleanPhone2 = phone.replace(/\s+/g, '').replace(/^20/, '0');

            // Fetch active orders (Pending, Processing, Confirmed)
            const { data: activeOrders, error } = await supabase
                .from('orders')
                .select('id, order_number, shipping_address, status, created_at, tracking_number, bosta_id')
                .in('status', ['Pending', 'Processing', 'Confirmed', 'Shipped'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!activeOrders || activeOrders.length === 0) return null;

            // Find the first order matching the phone number in shipping_address
            const matchedOrder = activeOrders.find(order => {
                let addr = order.shipping_address;
                if (typeof addr === 'string') {
                    try { addr = JSON.parse(addr); } catch (e) { return false; }
                }
                
                if (addr && addr.phone) {
                    const addrPhone = addr.phone.toString().replace(/\s+/g, '').replace(/^\+20/, '0').replace(/^20/, '0');
                    return addrPhone === cleanPhone || addrPhone === cleanPhone2;
                }
                
                return false;
            });

            return matchedOrder || null;
        } catch (error) {
            console.error('❌ Error finding order by phone:', error);
            return null;
        }
    }
}

module.exports = new OrderService();
