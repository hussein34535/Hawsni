const { supabaseAdmin } = require('./config/supabase');

async function migrateTemplatesFromOrders() {
    console.log('🔍 Syncing templates from orders...');
    
    // 1. Get all orders
    const { data: orders, error: oError } = await supabaseAdmin
        .from('orders')
        .select('shipping_address, created_at');
    
    if (oError) {
        console.error('Error fetching orders:', oError);
        return;
    }

    const customerData = new Map(); // phone -> createdAt
    orders.forEach(o => {
        let ship = o.shipping_address;
        if (typeof ship === 'string') {
            try { ship = JSON.parse(ship); } catch(e) {}
        }
        if (ship && (ship.phone || ship.guestPhone)) {
            let p = (ship.phone || ship.guestPhone).replace(/\D/g, '');
            if (p.startsWith('01') && p.length === 11) p = '2' + p;
            if (p) {
                // Keep the latest order date
                if (!customerData.has(p) || new Date(o.created_at) > new Date(customerData.get(p))) {
                    customerData.set(p, o.created_at);
                }
            }
        }
    });

    console.log(`Found ${customerData.size} unique customers in orders.`);

    // 2. Get existing sessions and messages
    const { data: existingSessions } = await supabaseAdmin.from('chat_sessions').select('session_id');
    const existingSessionIds = new Set(existingSessions.map(s => s.session_id));

    const { data: existingMessages } = await supabaseAdmin.from('chat_messages').select('session_id');
    const idsWithMessages = new Set(existingMessages.map(m => m.session_id));

    // 3. Process
    let count = 0;
    for (const [phone, createdAt] of customerData.entries()) {
        // Create session if missing
        if (!existingSessionIds.has(phone)) {
            await supabaseAdmin.from('chat_sessions').insert([{
                session_id: phone,
                status: 'bot_active',
                platform: 'whatsapp',
                updated_at: createdAt
            }]);
            console.log(`✅ Created session for: ${phone}`);
        }

        // Add placeholder message if no history exists for this phone
        if (!idsWithMessages.has(phone)) {
            await supabaseAdmin.from('chat_messages').insert([{
                session_id: phone,
                sender_type: 'bot',
                content: '📦 [نظام] تم إرسال قالب تأكيد الطلب لهذا العميل سابقاً.',
                created_at: createdAt
            }]);
            console.log(`📝 Added history placeholder for: ${phone}`);
            count++;
        }
    }

    console.log(`🎉 Done. Added ${count} customers who received templates previously.`);
}

migrateTemplatesFromOrders();
