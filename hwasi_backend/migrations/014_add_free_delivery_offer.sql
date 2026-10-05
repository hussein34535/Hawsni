-- 014: per-product "free delivery when ordering 2 items" offer.
-- Shows a gold row inside the floating cart pill on the product page.
ALTER TABLE products ADD COLUMN IF NOT EXISTS free_delivery_offer BOOLEAN DEFAULT false;
