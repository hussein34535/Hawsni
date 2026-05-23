const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bdgwkcenzmeuvwmcjhfi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkZ3drY2Vuem1ldXZ3bWNqaGZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg2MzIwNiwiZXhwIjoyMDc4NDM5MjA2fQ.O1m6uN_ZvSWYUIer0aBHEiTXdpZ0mrDhKJlQuC5TFi4';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function searchOrders() {
  // Fetch ALL orders with items and related product data
  const { data: allOrders, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(id, name, images, price))')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Query error:', error);
    return;
  }

  console.log(`Total orders in database: ${allOrders?.length || 0}\n`);

  // Define search criteria
  const searchTerms = {
    names: ['احمد', 'ahmed', 'achmed', 'a7med', 'أحمد'],
    phone1: '01151814498',
    phone2: '01032252473',
    email: 'choperahmed0115@gmail.com',
    addressParts: ['المنصوره', 'المنصورة', 'الدقهليه', 'الدقهلية', 'دقهليه', 'دقهلية', 'منصورة', 'منصوره'],
    customerName: 'اسامه',
  };

  const matchedOrders = [];

  for (const order of allOrders) {
    let addr = order.shipping_address;
    if (typeof addr === 'string') {
      try { addr = JSON.parse(addr); } catch (e) { addr = {}; }
    }

    const addrStr = JSON.stringify(addr || {}).toLowerCase();
    const nameStr = (addr?.name || '').toLowerCase();
    const phoneStr = (addr?.phone || '').toString().replace(/\s+/g, '');
    const altPhoneStr = (addr?.alt_phone || addr?.phone2 || '').toString().replace(/\s+/g, '');
    const emailStr = (addr?.email || '').toLowerCase();

    // Check name contains any search term
    const nameMatch = searchTerms.names.some(term => nameStr.includes(term.toLowerCase()));
    const customerNameMatch = nameStr.includes(searchTerms.customerName.toLowerCase());

    // Check phone
    const phoneMatch = phoneStr.includes(searchTerms.phone1) || phoneStr.includes(searchTerms.phone2) ||
                       altPhoneStr.includes(searchTerms.phone1) || altPhoneStr.includes(searchTerms.phone2);

    // Check email
    const emailMatch = emailStr.includes(searchTerms.email.toLowerCase());

    // Check address
    const addressMatch = searchTerms.addressParts.some(part => addrStr.includes(part.toLowerCase()));

    // Also check order.notes and any other text fields
    const notesStr = (order.notes || '').toLowerCase();
    const notesMatch = searchTerms.names.some(term => notesStr.includes(term.toLowerCase()));

    if (nameMatch || phoneMatch || emailMatch || addressMatch || notesMatch || customerNameMatch) {
      matchedOrders.push(order);
    }
  }

  console.log(`Matching orders found: ${matchedOrders.length}\n`);

  if (matchedOrders.length === 0) {
    console.log('No orders matched. Here are ALL orders for manual inspection:');
    for (const o of allOrders) {
      let addr = o.shipping_address;
      if (typeof addr === 'string') { try { addr = JSON.parse(addr); } catch (e) { addr = {}; } }
      console.log(`ID: ${o.id} | Order#: ${o.order_number} | Name: ${addr?.name || 'N/A'} | Phone: ${addr?.phone || 'N/A'} | Email: ${addr?.email || 'N/A'} | Address: ${addr?.address || 'N/A'} | City: ${addr?.city || addr?.governorate || 'N/A'} | Total: ${o.total} | Status: ${o.status} | Date: ${o.created_at}`);
    }
    return;
  }

  for (const order of matchedOrders) {
    let addr = order.shipping_address;
    if (typeof addr === 'string') { try { addr = JSON.parse(addr); } catch (e) { addr = {}; } }

    console.log('='.repeat(80));
    console.log(`🔹 ORDER #${order.order_number || order.id}`);
    console.log('='.repeat(80));
    console.log(`Order ID:       ${order.id}`);
    console.log(`Order Number:   ${order.order_number}`);
    console.log(`Status:         ${order.status}`);
    console.log(`Created At:     ${order.created_at}`);
    console.log(`Total:          ${order.total}`);
    console.log(`Subtotal:       ${order.subtotal}`);
    console.log(`Shipping Fee:   ${order.shipping_fee}`);
    console.log(`Discount:       ${order.discount}`);
    console.log(`Coupon:         ${order.coupon_code || 'N/A'}`);
    console.log(`Payment Method: ${order.payment_method}`);
    console.log(`Is Paid:        ${order.is_paid}`);
    console.log(`Notes:          ${order.notes || 'N/A'}`);
    console.log(`Delivered At:   ${order.delivered_at || 'N/A'}`);
    console.log(``);
    console.log(`📋 Shipping Address:`);
    console.log(`   Name:         ${addr?.name || 'N/A'}`);
    console.log(`   Phone:        ${addr?.phone || 'N/A'}`);
    console.log(`   Alt Phone:    ${addr?.alt_phone || addr?.phone2 || 'N/A'}`);
    console.log(`   Email:        ${addr?.email || 'N/A'}`);
    console.log(`   Address:      ${addr?.address || 'N/A'}`);
    console.log(`   City:         ${addr?.city || 'N/A'}`);
    console.log(`   Governorate:  ${addr?.governorate || addr?.gov || 'N/A'}`);
    console.log(`   District:     ${addr?.district || 'N/A'}`);
    console.log(`   Postal Code:  ${addr?.postal_code || 'N/A'}`);
    console.log(``);
    console.log(`📦 Order Items (${order.order_items?.length || 0}):`);
    for (const item of order.order_items || []) {
      const product = item.products;
      console.log(`   - ${item.name} x${item.quantity} = ${item.price * item.quantity}${item.size ? ` (Size: ${item.size})` : ''}${item.color ? ` (Color: ${item.color})` : ''}`);
    }
    console.log(``);
  }
}

searchOrders().catch(console.error);
