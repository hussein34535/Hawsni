-- Add crop/focal position for banners (object-position)
-- Allows admin to control which part of the image is visible (e.g. 50% 30% = center top)
ALTER TABLE banners ADD COLUMN IF NOT EXISTS focal_x INT DEFAULT 50 CHECK (focal_x >= 0 AND focal_x <= 100);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS focal_y INT DEFAULT 50 CHECK (focal_y >= 0 AND focal_y <= 100);
-- Also ensure blur/opacity columns exist (used by form but missing in controller)
ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_opacity DOUBLE PRECISION DEFAULT 1.0;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS image_blur DOUBLE PRECISION DEFAULT 0;
