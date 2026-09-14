-- 013: per-product size-fit advisor.
-- 'true'  = true to size (default, previous behavior)
-- 'small' = model runs small  -> recommend one size up
-- 'large' = model runs large  -> recommend one size down
ALTER TABLE products ADD COLUMN IF NOT EXISTS fit_type TEXT DEFAULT 'true';
