-- Add deposit_receipt_url column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deposit_receipt_url TEXT;

-- Note: Also ensure the 'receipts' bucket exists in Supabase Storage
-- Create it manually from Supabase Dashboard: Storage → New bucket → name: 'receipts', public: true
