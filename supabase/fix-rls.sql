-- ============================================================
-- FIX: "infinite recursion detected in policy for relation profiles"
-- Run entire script in Supabase SQL Editor
-- ============================================================

-- Helper runs as superuser so it does NOT re-trigger profiles RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- ---------- PROFILES ----------
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING (public.is_admin());

-- ---------- CATEGORIES ----------
DROP POLICY IF EXISTS "Anyone authenticated can read categories" ON categories;
DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

CREATE POLICY "categories_public_read" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- PRODUCTS ----------
DROP POLICY IF EXISTS "Customers see available products" ON products;
DROP POLICY IF EXISTS "products_public_read_available" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

CREATE POLICY "products_select" ON products
  FOR SELECT USING (is_available = true OR public.is_admin());

CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- ORDERS ----------
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (public.is_admin());

-- ---------- ORDER ITEMS ----------
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;

CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (public.is_admin());

-- ---------- GRANTS ----------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
