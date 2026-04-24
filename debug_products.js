const supabase = require('./hawsni_backend/config/supabase');

async function debugProducts() {
    try {
        console.log('--- Attempting join select: *, categories(name) ---');
        const { data: products, error } = await supabase.from('products').select('*, categories(name)');
        if (error) {
            console.error('❌ Join Query Error:', error);
        } else {
            console.log('✅ Join Query Success. Count:', products?.length);
            if (products?.length > 0) {
                console.log('First product categories:', products[0].categories);
            }
        }

        console.log('\n--- Attempting simple select: * ---');
        const { data: simpleProducts, error: simpleError } = await supabase.from('products').select('*');
        if (simpleError) {
            console.error('❌ Simple Query Error:', simpleError);
        } else {
            console.log('✅ Simple Query Success. Count:', simpleProducts?.length);
        }

        console.log('\n--- Checking categories table ---');
        const { data: categories, error: catError } = await supabase.from('categories').select('*');
        if (catError) {
            console.error('❌ Categories Query Error:', catError);
        } else {
            console.log('✅ Categories Query Success. Count:', categories?.length);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

debugProducts();
