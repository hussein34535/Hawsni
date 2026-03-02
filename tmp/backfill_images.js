const supabase = require('../hawsni_backend/config/supabase');

async function backfill() {
    console.log('🚀 Starting backfill of product thumbnails...');

    const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, images, name')
        .is('image', null);

    if (fetchError) {
        console.error('❌ Error fetching products:', fetchError);
        return;
    }

    console.log(`📦 Found ${products.length} products to update.`);

    for (const product of products) {
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            const firstImage = product.images[0];
            const { error: updateError } = await supabase
                .from('products')
                .update({ image: firstImage })
                .eq('id', product.id);

            if (updateError) {
                console.error(`❌ Failed to update product ${product.name} (${product.id}):`, updateError);
            } else {
                console.log(`✅ Updated: ${product.name}`);
            }
        } else {
            console.log(`⚠️ Skipping: ${product.name} (No images)`);
        }
    }

    console.log('🏁 Backfill complete!');
}

backfill();
