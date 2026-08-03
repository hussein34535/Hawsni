const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function patchOrders() {
    try {
        console.log('--- Patching Orders for Pricing Discrepancy ---');
        
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*, order_items(*, products(price, discount))')
            .order('created_at', { ascending: false })
            .limit(100);

        if (ordersError) throw ordersError;

        let patchedCount = 0;

        for (const order of orders) {
            let needsUpdate = false;
            let expectedSubtotal = 0;

            for (const item of order.order_items) {
                const prod = item.products;
                if (!prod) continue;

                const basePrice = parseFloat(prod.price) || 0;
                const discountVal = parseFloat(prod.discount) || 0;
                
                const buggyPrice = Math.round(Math.max(0, basePrice - discountVal) * 100) / 100;
                const correctPrice = Math.round(basePrice * (1 - (discountVal / 100)) * 100) / 100;

                const savedPrice = parseFloat(item.price) || 0;

                if (Math.abs(savedPrice - buggyPrice) < 0.05 && Math.abs(savedPrice - correctPrice) > 0.05) {
                    needsUpdate = true;
                    console.log(`  Updating Item ${item.id} (Order ${order.order_number}): ${savedPrice} -> ${correctPrice}`);
                    
                    const { error: itemError } = await supabase
                        .from('order_items')
                        .update({ price: correctPrice })
                        .eq('id', item.id);
                    
                    if (itemError) throw itemError;
                    expectedSubtotal += correctPrice * (parseInt(item.quantity) || 1);
                } else {
                    expectedSubtotal += savedPrice * (parseInt(item.quantity) || 1);
                }
            }

            if (needsUpdate) {
                const newTotal = Math.max(0, expectedSubtotal + (parseFloat(order.shipping_fee) || 0) - (parseFloat(order.discount) || 0));
                console.log(`  Updating Order ${order.id} (#${order.order_number}): Total ${order.total} -> ${newTotal}`);
                
                const { error: orderError } = await supabase
                    .from('orders')
                    .update({ 
                        subtotal: expectedSubtotal,
                        total: newTotal
                    })
                    .eq('id', order.id);

                if (orderError) throw orderError;
                patchedCount++;
            }
        }

        console.log(`--- Finished! Patched ${patchedCount} orders. ---`);

    } catch (err) {
        console.error('Error during patching:', err);
    }
}

patchOrders();
