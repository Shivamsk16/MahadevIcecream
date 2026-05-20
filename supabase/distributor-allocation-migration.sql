-- Distributor allocation qty on order_items (admin order detail only)
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS distributor_allocation_qty INT DEFAULT NULL;

-- Allow admins to save inline distributor allocation qty
DROP POLICY IF EXISTS "Admins can update order items" ON order_items;

CREATE POLICY "Admins can update order items" ON order_items
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
