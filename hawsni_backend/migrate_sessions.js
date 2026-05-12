const { supabaseAdmin } = require('./config/supabase');

async function migrateFromOrders() {
    console.log('🔍 Syncing chat sessions from orders...');
    
    // 1. Get all orders
    const { data: orders, error: oError } = await supabaseAdmin
        .from('orders')
        .select('shipping_address');
    
    if (oError) {
        console.error('Error fetching orders:', oError);
        return;
    }

    const phones = new Set();
    orders.forEach(o => {
        let ship = o.shipping_address;
        if (typeof ship === 'string') {
            try { ship = JSON.parse(ship); } catch(e) {}
        }
        if (ship && (ship.phone || ship.guestPhone)) {
            let p = (ship.phone || ship.guestPhone).replace(/\D/g, '');
            if (p.startsWith('01') && p.length === 11) p = '2' + p;
            if (p) phones.add(p);
        }
    });

    console.log(`Found ${phones.size} unique phone numbers in orders.`);

    // 2. Get existing sessions
    const { data: sessions, error: sError } = await supabaseAdmin
        .from('chat_sessions')
        .select('session_id');
    
    const existingIds = new Set(sessions.map(s => s.session_id));

    // 3. Create missing
    let count = 0;
    for (const phone of phones) {
        if (!existingIds.has(phone)) {
            const { error: iError } = await supabaseAdmin
                .from('chat_sessions')
                .insert([{
                    session_id: phone,
                    status: 'bot_active',
                    platform: 'whatsapp',
                    updated_at: new Date().toISOString()
                }]);
            
            if (!iError) {
                console.log(`✅ Created session for order customer: ${phone}`);
                count++;
            }
        }
    }

    console.log(`🎉 Migration completed. Added ${count} new sessions.`);
}

migrateFromOrders();
