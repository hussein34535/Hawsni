const { supabaseAdmin: supabase } = require('./config/supabase');

async function diagnoseSystem() {
    console.log('=== 🛠️ Hwasi System Diagnostics ===');
    const tables = [
        'users', 'categories', 'products', 'product_variants', 
        'orders', 'order_items', 'banners', 'coupons', 
        'reviews', 'shipping_settings'
    ];

    const stats = {};

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
        
        if (error) {
            stats[table] = `❌ Error: ${error.message}`;
        } else {
            stats[table] = `✅ ${count} records`;
        }
    }

    console.table(stats);

    // Deep dive into some critical data
    console.log('\n--- 📦 Product Health ---');
    const { data: products } = await supabase.from('products').select('id, name, price, stock, is_active').limit(3);
    if (products && products.length > 0) {
        products.forEach(p => console.log(`- ${p.name} | Price: ${p.price} | Stock: ${p.stock} | Active: ${p.is_active}`));
    } else {
        console.log('No products found!');
    }

    console.log('\n--- 🛒 Recent Orders ---');
    const { data: orders } = await supabase.from('orders').select('id, total, status, created_at').order('created_at', { ascending: false }).limit(3);
    if (orders && orders.length > 0) {
        orders.forEach(o => console.log(`- Order #${o.id.substring(0,8)} | Total: ${o.total} | Status: ${o.status}`));
    } else {
        console.log('No orders found!');
    }

    console.log('\n--- 👥 Admins Check ---');
    const { data: admins } = await supabase.from('users').select('email, full_name').eq('role', 'admin');
    if (admins && admins.length > 0) {
        admins.forEach(a => console.log(`- Admin: ${a.email}`));
    } else {
        console.log('No admins detected!');
    }

    console.log('\n=== ✅ Diagnostics Complete ===');
    process.exit(0);
}

diagnoseSystem();
