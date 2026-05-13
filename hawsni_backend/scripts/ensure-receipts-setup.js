require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch },
});

async function run() {
  // 1. Ensure receipts bucket
  const { data: buckets, error: bError } = await supabase.storage.listBuckets();
  if (bError) { console.error('Error listing buckets:', bError); process.exit(1); }

  const exists = buckets.some(b => b.name === 'receipts');
  if (exists) {
    console.log('✅ Bucket "receipts" already exists');
  } else {
    const { error: createError } = await supabase.storage.createBucket('receipts', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 5242880,
    });
    if (createError) { console.error('Error creating bucket:', createError); process.exit(1); }
    console.log('✅ Bucket "receipts" created');
  }

  // 2. Check deposit_receipt_url column
  const { error: colError } = await supabase.from('orders').select('deposit_receipt_url').limit(1);
  if (colError && (colError.message?.includes('column') || colError.code === 'PGRST116')) {
    console.log('❌ Column deposit_receipt_url is missing!');
    console.log('');
    console.log('Run this SQL in Supabase Dashboard (SQL Editor):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS deposit_receipt_url TEXT;');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } else {
    console.log('✅ Column deposit_receipt_url exists');
  }
}

run().then(() => process.exit(0));
