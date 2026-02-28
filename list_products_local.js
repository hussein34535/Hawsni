const path = require('path');
const supabase = require('./hawsni_backend/config/supabase');

async function listProducts() {
    try {
        const { data, error } = await supabase.from('products').select('name, description');
        if (error) {
            console.error('Supabase Error:', error);
            return;
        }
        console.log('--- PRODUCTS START ---');
        console.log(JSON.stringify(data, null, 2));
        console.log('--- PRODUCTS END ---');
    } catch (err) {
        console.error('Script Error:', err);
    }
}

listProducts();
