-- Collision-safe order numbers: ORD-YYYYMMDD-XXXXXX (random hex suffix + retry in DB)
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  candidate TEXT;
  attempts INT := 0;
  date_part TEXT;
  suffix TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');

  LOOP
    attempts := attempts + 1;
    suffix := UPPER(SUBSTRING(ENCODE(gen_random_bytes(3), 'hex') FROM 1 FOR 6));
    candidate := 'ORD-' || date_part || '-' || suffix;

    IF NOT EXISTS (
      SELECT 1 FROM orders WHERE order_number = candidate
    ) THEN
      RETURN candidate;
    END IF;

    IF attempts >= 12 THEN
      RAISE EXCEPTION 'Could not generate unique order number after % attempts', attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
