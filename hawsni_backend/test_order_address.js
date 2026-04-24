import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: order } = await supabase.from('orders').select('*').eq('id', '3bad5166-7207-4fa8-ab25-850e32f659c3').single();
    if (!order) {
        console.log("Order not found");
        return;
    }
    console.log("Shipping address:", order.shipping_address);
}
run();
