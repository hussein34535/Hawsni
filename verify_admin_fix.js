const supabase = require('./hwasi_backend/config/supabase');

async function verifyFix() {
    try {
        console.log('--- Attempting fixed join select: *, categories!products_category_id_fkey(name) ---');
        const { data: products, error } = await supabase.from('products').select('*, categories!products_category_id_fkey(name)');
        if (error) {
            console.error('❌ Fixed Join Query Error:', error);
        } else {
            console.log('✅ Fixed Join Query Success. Count:', products?.length);
            if (products?.length > 0) {
                console.log('First product category:', products[0].categories);
            }
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

verifyFix();
