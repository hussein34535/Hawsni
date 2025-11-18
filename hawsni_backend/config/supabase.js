require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Please add SUPABASE_URL and SUPABASE_ANON_KEY');
}

// Use service role key for admin operations (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

module.exports = supabase;
