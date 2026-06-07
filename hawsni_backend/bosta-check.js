const fetch = require('node-fetch');
require('dotenv').config({ path: __dirname + '/.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch } });

(async () => {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, tracking_number, status')
    .not('tracking_number', 'is', null)
    .not('status', 'in', '("Delivered","Cancelled")');

  if (error) { console.error(error); return; }
  console.log(orders.length + ' orders still pending:\n');
  for (const o of orders) {
    const tn = o.tracking_number;
    try {
      const res = await fetch('https://tracking.bosta.co/shipments/track/' + tn + '?lang=ar', {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
      });
      if (!res.ok) {
        console.log('#' + (o.order_number || o.id.substring(0,8)) + ' | status: ' + o.status + ' | tn: ' + tn + ' | HTTP ' + res.status);
        continue;
      }
      const data = await res.json();
      const code = data.CurrentStatus?.code;
      const state = data.CurrentStatus?.state || 'UNKNOWN';
      const ts = data.CurrentStatus?.timestamp || '';
      console.log('#' + (o.order_number || o.id.substring(0,8)) + ' | status: ' + o.status + ' | tn: ' + tn + ' | Bosta: code=' + code + ' state=' + state + ' | ' + ts.substring(0,10));
    } catch (e) {
      console.log('#' + (o.order_number || o.id.substring(0,8)) + ' | tn: ' + tn + ' | Error: ' + e.message);
    }
  }
})();
