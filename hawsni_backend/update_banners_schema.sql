-- Add customization fields to banners table
ALTER TABLE banners 
ADD COLUMN IF NOT EXISTS heading_text TEXT,
ADD COLUMN IF NOT EXISTS subheading_text TEXT,
ADD COLUMN IF NOT EXISTS button_text VARCHAR(100) DEFAULT 'Shop Now',
ADD COLUMN IF NOT EXISTS button_color VARCHAR(7) DEFAULT '#D4AF37',
ADD COLUMN IF NOT EXISTS button_style VARCHAR(20) DEFAULT 'rounded',
ADD COLUMN IF NOT EXISTS button_size VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS button_position VARCHAR(20) DEFAULT 'bottom-right',
ADD COLUMN IF NOT EXISTS button_link TEXT,
ADD COLUMN IF NOT EXISTS button_opacity DECIMAL(3,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS image_blur DECIMAL(4,1) DEFAULT 0.0;

-- Update existing banners with default values
UPDATE banners 
SET button_text = 'Shop Now',
    button_color = '#D4AF37',
    button_style = 'rounded',
    button_size = 'medium',
    button_position = 'bottom-right',
    button_opacity = 1.0,
    image_blur = 0.0
WHERE button_text IS NULL;
