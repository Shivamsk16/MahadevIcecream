-- Inventory tracking migration — run in Supabase SQL Editor after schema.sql

-- 2.1 products: low_stock_threshold + non-negative stock
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 10 NOT NULL;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_stock_quantity_non_negative;
ALTER TABLE products
  ADD CONSTRAINT products_stock_quantity_non_negative CHECK (stock_quantity >= 0);

-- 2.2 stock_logs (append-only audit trail)
CREATE TABLE IF NOT EXISTS stock_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (
    change_type IN ('manual_add', 'manual_deduct', 'order_placed', 'order_cancelled')
  ),
  quantity_change INT NOT NULL,
  quantity_before INT NOT NULL,
  quantity_after INT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  note TEXT,
  changed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view stock logs" ON stock_logs;
CREATE POLICY "Admins can view stock logs"
  ON stock_logs FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert stock logs" ON stock_logs;
CREATE POLICY "Admins can insert stock logs"
  ON stock_logs FOR INSERT
  WITH CHECK (public.is_admin());

-- 2.3 Deduct stock atomically before order creation
CREATE OR REPLACE FUNCTION deduct_stock_on_order(
  p_items JSONB,
  p_changed_by UUID DEFAULT auth.uid()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
  pid UUID;
  qty INT;
  current_stock INT;
  product_name TEXT;
  new_stock INT;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'EMPTY_CART';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    pid := (item->>'product_id')::UUID;
    qty := (item->>'quantity')::INT;

    IF qty IS NULL OR qty <= 0 THEN
      RAISE EXCEPTION 'INVALID_QUANTITY';
    END IF;

    SELECT stock_quantity, name
    INTO current_stock, product_name
    FROM products
    WHERE id = pid
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
    END IF;

    IF current_stock < qty THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', product_name;
    END IF;

    new_stock := current_stock - qty;

    UPDATE products
    SET stock_quantity = new_stock, updated_at = NOW()
    WHERE id = pid;

    INSERT INTO stock_logs (
      product_id,
      change_type,
      quantity_change,
      quantity_before,
      quantity_after,
      changed_by
    ) VALUES (
      pid,
      'order_placed',
      -qty,
      current_stock,
      new_stock,
      p_changed_by
    );
  END LOOP;
END;
$$;

-- 2.4 Restore stock when order is cancelled (idempotent)
CREATE OR REPLACE FUNCTION restore_stock_on_cancel(
  p_order_id UUID,
  p_changed_by UUID DEFAULT auth.uid()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  oi RECORD;
  current_stock INT;
  new_stock INT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM stock_logs
    WHERE order_id = p_order_id AND change_type = 'order_cancelled'
  ) THEN
    RETURN;
  END IF;

  FOR oi IN
    SELECT product_id, quantity
    FROM order_items
    WHERE order_id = p_order_id AND product_id IS NOT NULL
  LOOP
    SELECT stock_quantity INTO current_stock
    FROM products
    WHERE id = oi.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    new_stock := current_stock + oi.quantity;

    UPDATE products
    SET stock_quantity = new_stock, updated_at = NOW()
    WHERE id = oi.product_id;

    INSERT INTO stock_logs (
      product_id,
      change_type,
      quantity_change,
      quantity_before,
      quantity_after,
      order_id,
      changed_by
    ) VALUES (
      oi.product_id,
      'order_cancelled',
      oi.quantity,
      current_stock,
      new_stock,
      p_order_id,
      p_changed_by
    );
  END LOOP;
END;
$$;

-- Admin manual stock adjustment (atomic update + log)
CREATE OR REPLACE FUNCTION adjust_product_stock(
  p_product_id UUID,
  p_action TEXT,
  p_quantity INT,
  p_note TEXT DEFAULT NULL,
  p_changed_by UUID DEFAULT auth.uid()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock INT;
  new_stock INT;
  change_type TEXT;
  qty_change INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY';
  END IF;

  IF p_action NOT IN ('add', 'deduct') THEN
    RAISE EXCEPTION 'INVALID_ACTION';
  END IF;

  SELECT stock_quantity INTO current_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
  END IF;

  IF p_action = 'add' THEN
    change_type := 'manual_add';
    qty_change := p_quantity;
    new_stock := current_stock + p_quantity;
  ELSE
    change_type := 'manual_deduct';
    qty_change := -p_quantity;
    new_stock := current_stock - p_quantity;
    IF new_stock < 0 THEN
      RAISE EXCEPTION 'NEGATIVE_STOCK';
    END IF;
  END IF;

  UPDATE products
  SET stock_quantity = new_stock, updated_at = NOW()
  WHERE id = p_product_id;

  INSERT INTO stock_logs (
    product_id,
    change_type,
    quantity_change,
    quantity_before,
    quantity_after,
    note,
    changed_by
  ) VALUES (
    p_product_id,
    change_type,
    qty_change,
    current_stock,
    new_stock,
    p_note,
    p_changed_by
  );
END;
$$;

GRANT EXECUTE ON FUNCTION deduct_stock_on_order(JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_stock_on_cancel(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION adjust_product_stock(UUID, TEXT, INT, TEXT, UUID) TO authenticated;

-- Realtime for live inventory alerts on dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE products;
