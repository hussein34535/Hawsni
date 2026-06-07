const fetch = require('node-fetch');
require('dotenv').config({ path: __dirname + '/.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch } });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function mapStatus(code) {
  if (code === 45) return 'Delivered';
  if (code >= 21 && code <= 44) return 'Shipped';
  if ([46, 47, 49, 50].includes(code)) return 'Cancelled';
  return null;
}

(async () => {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, tracking_number, status')
    .not('tracking_number', 'is', null)
    .not('status', 'in', '("Delivered","Cancelled")');

  if (error) { console.error('Fetch error:', error); return; }
  console.log('Found', orders.length, 'orders still pending\n');

  let updated = 0, errors = 0, noChange = 0, skipped = 0;
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const tn = order.tracking_number;
    await sleep(300);
    try {
      const res = await fetch('https://tracking.bosta.co/shipments/track/' + tn + '?lang=ar', {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      if (!res.ok) {
        console.log('  [SKIP] #' + (order.order_number || order.id.substring(0,8)) + ' tn=' + tn + ' HTTP ' + res.status);
        skipped++;
        continue;
      }
      const data = await res.json();
      const code = data.CurrentStatus?.code;
      if (!code) { skipped++; console.log('  [SKIP] #' + (order.order_number || order.id.substring(0,8)) + ' tn=' + tn + ' no code'); continue; }
      const newStatus = mapStatus(code);
      if (!newStatus) { skipped++; console.log('  [SKIP] #' + (order.order_number || order.id.substring(0,8)) + ' tn=' + tn + ' unmapped code=' + code); continue; }
      if (order.status === newStatus) { noChange++; continue; }
      const { error: uErr } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
      if (uErr) { errors++; console.log('  [ERR] #' + (order.order_number || order.id.substring(0,8)) + ' tn=' + tn + ' ' + uErr.message); }
      else { updated++; console.log('  ' + (order.order_number || order.id.substring(0,8)) + ' ' + order.status + ' \u2192 ' + newStatus + ' (code ' + code + ')'); }
    } catch (e) { errors++; console.log('  [ERR] #' + (order.order_number || order.id.substring(0,8)) + ' tn=' + tn + ' ' + e.message); }
  }

  console.log('\n=== Summary ===');
  console.log('Updated:', updated, '| No change:', noChange, '| Skipped:', skipped, '| Errors:', errors);
})();
