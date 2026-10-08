-- 015: optional size-guide image per product (shown in the size guide modal).
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_guide_image TEXT DEFAULT '';
