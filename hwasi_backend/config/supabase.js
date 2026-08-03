const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  const errorMsg = '❌ CRITICAL ERROR: Missing Supabase credentials in .env file. Application cannot start.';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

// Anon Key client — for general use (enforces RLS)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    fetch: fetch,
  },
});

// Service Role client — for admin/backend-only operations (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    fetch: fetch,
  },
});

module.exports = supabase;
module.exports.supabaseAdmin = supabaseAdmin;
module.exports.supabaseAuth = supabase; // Maintaining backward compat with some files
