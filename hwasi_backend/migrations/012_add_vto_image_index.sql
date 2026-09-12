-- 012: default AI/VTO garment image per product (index into the product images array).
-- 0 = first image (previous behavior). Set from the product form in the admin panel.
ALTER TABLE products ADD COLUMN IF NOT EXISTS vto_image_index INTEGER DEFAULT 0;
