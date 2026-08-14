-- ============================================================
-- 008_accounting.sql — نظام المحاسبة: التكلفة، التحصيل، المصروفات، رأس المال
-- ============================================================

-- 1) سعر التكلفة للمنتج (يستخدم لحساب الربح الحقيقي)
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0;

-- 2) لقطة سعر التكلفة داخل الطلب (حتى لو تغير سعر المنتج بعدين)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0;

-- 3) تتبع تحصيل الفلوس من الطلبات (Bosta COD وصل / تحويل بنكي وصل)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_collected BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS collected_at TIMESTAMPTZ;

-- 4) جدول المصروفات
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
    category TEXT NOT NULL DEFAULT 'other',
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5) جدول رأس المال والسحوبات
CREATE TABLE IF NOT EXISTS capital_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('capital', 'deposit', 'withdrawal')),
    amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6) Backfill: نسخ سعر التكلفة من المنتجات إلى الطلبات القديمة
UPDATE order_items oi
SET cost_price = COALESCE((SELECT p.cost_price FROM products p WHERE p.id = oi.product_id), 0)
WHERE oi.cost_price = 0 AND oi.product_id IS NOT NULL;
