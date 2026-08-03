const supabase = require('../hwasi_backend/config/supabase');

async function checkColumns() {
    console.log('🔍 Checking orders table columns...');
    const { data, error } = await supabase.from('orders').select('*').limit(1);

    if (error) {
        console.error('❌ Error:', error);
    } else if (data && data.length > 0) {
        console.log('✅ Columns found:', Object.keys(data[0]).join(', '));
    } else {
        console.log('ℹ️ No orders found to check columns.');
    }
}

checkColumns();
