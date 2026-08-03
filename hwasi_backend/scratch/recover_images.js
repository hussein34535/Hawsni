
const supabase = require('../config/supabase');

async function findLostImages() {
    const productId = '7b669edc-3c88-4a26-9f07-993ec23408dc';
    console.log(`🔍 Searching for product: ${productId}`);

    // 1. Check current product state
    const { data: product, error: pError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

    if (pError) {
        console.error('❌ Error fetching product:', pError.message);
        return;
    }

    console.log('📦 Current Product Name:', product.name);
    console.log('🖼️ Current Images:', product.images);

    // 2. Search in orders
    console.log('🔎 Searching in orders for historical images...');
    const { data: orders, error: oError } = await supabase
        .from('orders')
        .select('product_image, product_name')
        .eq('product_id', productId)
        .limit(20);

    if (orders && orders.length > 0) {
        const historicalImages = [...new Set(orders.map(o => o.product_image).filter(img => img))];
        if (historicalImages.length > 0) {
            console.log('✅ Found historical images in orders:');
            historicalImages.forEach(img => console.log('🔗 ' + img));
        } else {
            console.log('❌ No images found in orders.');
        }
    } else {
        console.log('❌ No orders found for this product.');
    }

    // 3. Search in chat_messages (if images were shared)
    console.log('🔎 Searching in chat_messages...');
    const { data: chats, error: cError } = await supabase
        .from('chat_messages')
        .select('content')
        .ilike('content', `%${productId}%`);

    if (chats && chats.length > 0) {
        console.log('✅ Found traces in chat messages.');
    }

    // 4. Search for similar products
    console.log('🔎 Searching for similar products...');
    const { data: similar, error: sError } = await supabase
        .from('products')
        .select('name, images')
        .ilike('name', `%${product.name}%`)
        .neq('id', productId);

    if (similar && similar.length > 0) {
        console.log('✅ Found similar products:');
        similar.forEach(s => {
            if (s.images && s.images.length > 0) {
                console.log(`🔹 ${s.name}: ${JSON.stringify(s.images)}`);
            }
        });
    }
}

findLostImages();
