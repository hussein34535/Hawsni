const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function analyzeOrders() {
    try {
        console.log('--- Analyzing Orders for Pricing Discrepancy ---');
        
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*, order_items(*, products(price, discount))')
            .order('created_at', { ascending: false })
            .limit(100);

        if (ordersError) throw ordersError;

        const affectedOrders = [];

        for (const order of orders) {
            let hasDiscrepancy = false;
            let expectedSubtotal = 0;
            const itemFixes = [];

            for (const item of order.order_items) {
                const prod = item.products;
                if (!prod) continue;

                const basePrice = parseFloat(prod.price) || 0;
                const discountVal = parseFloat(prod.discount) || 0;
                
                const buggyPrice = Math.round(Math.max(0, basePrice - discountVal) * 100) / 100;
                const correctPrice = Math.round(basePrice * (1 - (discountVal / 100)) * 100) / 100;

                const savedPrice = parseFloat(item.price) || 0;

                if (Math.abs(savedPrice - buggyPrice) < 0.05 && Math.abs(savedPrice - correctPrice) > 0.05) {
                    hasDiscrepancy = true;
                    itemFixes.push({
                        itemId: item.id,
                        productId: item.product_id,
                        oldPrice: savedPrice,
                        newPrice: correctPrice,
                        quantity: item.quantity
                    });
                    expectedSubtotal += correctPrice * (parseInt(item.quantity) || 1);
                } else {
                    expectedSubtotal += savedPrice * (parseInt(item.quantity) || 1);
                }
            }

            if (hasDiscrepancy) {
                const newTotal = Math.max(0, expectedSubtotal + (parseFloat(order.shipping_fee) || 0) - (parseFloat(order.discount) || 0));
                affectedOrders.push({
                    orderId: order.id,
                    orderNumber: order.order_number,
                    createdAt: order.created_at,
                    oldTotal: order.total,
                    newTotal: newTotal,
                    oldSubtotal: order.subtotal,
                    newSubtotal: expectedSubtotal,
                    fixes: itemFixes
                });
            }
        }

        console.log(`Found ${affectedOrders.length} affected orders.`);
        if (affectedOrders.length > 0) {
            console.log(JSON.stringify(affectedOrders, null, 2));
        }

    } catch (err) {
        console.error('Error during analysis:', err);
    }
}

analyzeOrders();
