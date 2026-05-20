-- Human-readable order numbers: ORD-DD-MM-YYYY-NNNNN
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  day_part TEXT;
  month_part TEXT;
  year_part TEXT;
  seq INT;
BEGIN
  day_part := TO_CHAR(NOW(), 'DD');
  month_part := TO_CHAR(NOW(), 'MM');
  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO seq FROM orders WHERE DATE(placed_at) = CURRENT_DATE;
  RETURN 'ORD-' || day_part || '-' || month_part || '-' || year_part || '-' || LPAD(seq::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;
