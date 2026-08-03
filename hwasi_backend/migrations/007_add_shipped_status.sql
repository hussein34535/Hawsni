ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('Processing', 'Confirmed', 'Shipped', 'In Transit', 'Delivered', 'Cancelled', 'No Answer', 'Out of Stock'));
