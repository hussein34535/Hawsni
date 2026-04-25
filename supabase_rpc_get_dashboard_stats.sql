CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_products_count INT;
  v_categories_count INT;
  v_orders_count INT;
  v_users_count INT;
  v_banners_count INT;
  v_revenue NUMERIC;
  v_recent_products JSONB;
  v_recent_orders JSONB;
  v_status_counts JSONB;
  v_result JSONB;
BEGIN
  -- Products count
  SELECT count(*) INTO v_products_count FROM public.products;
  
  -- Categories count
  SELECT count(*) INTO v_categories_count FROM public.categories;
  
  -- Orders count
  SELECT count(*) INTO v_orders_count FROM public.orders;
  
  -- Users count (using public.users as seen in the codebase)
  SELECT count(*) INTO v_users_count FROM public.users;
  
  -- Banners count
  SELECT count(*) INTO v_banners_count FROM public.banners;
  
  -- Total Revenue (excluding Cancelled/Refunded)
  SELECT COALESCE(sum(total), 0) INTO v_revenue 
  FROM public.orders 
  WHERE status NOT IN ('Cancelled', 'Refunded', 'ملغي', 'مسترجع');
  
  -- Recent products (top 5)
  SELECT COALESCE(jsonb_agg(p), '[]'::jsonb) INTO v_recent_products
  FROM (
    SELECT id, name, price, images, created_at 
    FROM public.products 
    ORDER BY created_at DESC 
    LIMIT 5
  ) p;
  
  -- Recent orders (top 5)
  SELECT COALESCE(jsonb_agg(o), '[]'::jsonb) INTO v_recent_orders
  FROM (
    SELECT id, total, status, created_at, shipping_address 
    FROM public.orders 
    ORDER BY created_at DESC 
    LIMIT 5
  ) o;

  -- Status counts (for charts)
  SELECT COALESCE(jsonb_object_agg(status, count), '{}'::jsonb) INTO v_status_counts
  FROM (
    SELECT status, count(*) as count 
    FROM public.orders 
    GROUP BY status
  ) s;
  
  -- Build final JSON
  v_result := jsonb_build_object(
    'productsCount', COALESCE(v_products_count, 0),
    'categoriesCount', COALESCE(v_categories_count, 0),
    'ordersCount', COALESCE(v_orders_count, 0),
    'usersCount', COALESCE(v_users_count, 0),
    'bannersCount', COALESCE(v_banners_count, 0),
    'revenue', COALESCE(v_revenue, 0),
    'recentProducts', v_recent_products,
    'recentOrders', v_recent_orders,
    'statusCounts', v_status_counts
  );

  RETURN v_result;
END;
$$;
