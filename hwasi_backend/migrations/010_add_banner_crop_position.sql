-- NOTE: This migration is now OPTIONAL.
-- Banner crop/responsive config is stored self-contained in the `subtitle`
-- column as JSON ({"_cfg":{...}}) so it works without any new columns.
-- Running this is still nice-to-have if you want dedicated columns later.

ALTER TABLE banners ADD COLUMN IF NOT EXISTS focal_x INT DEFAULT 50 CHECK (focal_x >= 0 AND focal_x <= 100);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS focal_y INT DEFAULT 50 CHECK (focal_y >= 0 AND focal_y <= 100);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_opacity DOUBLE PRECISION DEFAULT 1.0;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS image_blur DOUBLE PRECISION DEFAULT 0;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS mobile_image_url TEXT;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS tablet_image_url TEXT;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS mobile_focal_x INT DEFAULT 50 CHECK (mobile_focal_x >= 0 AND mobile_focal_x <= 100);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS mobile_focal_y INT DEFAULT 50 CHECK (mobile_focal_y >= 0 AND mobile_focal_y <= 100);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS tablet_focal_x INT DEFAULT 50 CHECK (tablet_focal_x >= 0 AND tablet_focal_x <= 100);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS tablet_focal_y INT DEFAULT 50 CHECK (tablet_focal_y >= 0 AND tablet_focal_y <= 100);
