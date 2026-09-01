-- Responsive banner images: allow a different image / focal per device
ALTER TABLE banners ADD COLUMN IF NOT EXISTS mobile_image_url TEXT;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS tablet_image_url TEXT;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS mobile_focal_x INT DEFAULT 50 CHECK (mobile_focal_x >= 0 AND mobile_focal_x <= 100);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS mobile_focal_y INT DEFAULT 50 CHECK (mobile_focal_y >= 0 AND mobile_focal_y <= 100);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS tablet_focal_x INT DEFAULT 50 CHECK (tablet_focal_x >= 0 AND tablet_focal_x <= 100);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS tablet_focal_y INT DEFAULT 50 CHECK (tablet_focal_y >= 0 AND tablet_focal_y <= 100);
