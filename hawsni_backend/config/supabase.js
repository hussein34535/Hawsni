const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Please add SUPABASE_URL and SUPABASE_ANON_KEY');
}

// Use service role key for admin operations (bypasses RLS)
// Explicitly pass node-fetch to avoid Node 18+ native fetch issues with IPv6
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    fetch: fetch,
  },
});

module.exports = supabase;
