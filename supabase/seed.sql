-- MAHADEV Enterprises — Sample seed data
-- Run in Supabase SQL Editor AFTER schema.sql
-- Safe to re-run: uses ON CONFLICT where applicable

-- ============================================
-- CATEGORIES (skip if already from schema.sql)
-- ============================================
INSERT INTO categories (name, display_order, icon) VALUES
  ('Tubs', 1, '🍨'),
  ('Cups', 2, '🥤'),
  ('Cones', 3, '🍦'),
  ('Candies', 4, '🍭'),
  ('Family Packs', 5, '👨‍👩‍👧‍👦'),
  ('Bulk Packs', 6, '📦')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- PRODUCTS
-- ============================================
INSERT INTO products (
  category_id, name, description, price, mrp, sku,
  stock_quantity, is_available, discount_percent, scheme_label, purchase_quantity
) VALUES
  -- Tubs
  (
    (SELECT id FROM categories WHERE name = 'Tubs'),
    'Mango Delight Tub 1L',
    'Rich Alphonso mango ice cream. 1 litre tub for retail counters.',
    120, 140, 'TUB-MANGO-1L',
    50, TRUE, 14.29, 'Buy 10 Get 1 Free', 1
  ),
  (
    (SELECT id FROM categories WHERE name = 'Tubs'),
    'Chocolate Fudge Tub 1L',
    'Belgian cocoa fudge ripple. 1 litre tub.',
    130, 150, 'TUB-CHOCO-1L',
    45, TRUE, 13.33, NULL, 1
  ),
  (
    (SELECT id FROM categories WHERE name = 'Tubs'),
    'Butterscotch Crunch Tub 1L',
    'Classic butterscotch with nut crunch.',
    125, 145, 'TUB-BUTTER-1L',
    40, TRUE, 13.79, NULL, 1
  ),
  (
    (SELECT id FROM categories WHERE name = 'Tubs'),
    'Kesar Pista Tub 500ml',
    'Premium saffron and pistachio. Half litre.',
    95, 110, 'TUB-KESAR-500',
    60, TRUE, 13.64, NULL, 1
  ),

  -- Cups
  (
    (SELECT id FROM categories WHERE name = 'Cups'),
    'Strawberry Cup 100ml',
    'Single-serve strawberry cup. Case of 24.',
    30, 35, 'CUP-STRAW-100',
    200, TRUE, 14.29, 'Buy 24 Get 2 Free', 24
  ),
  (
    (SELECT id FROM categories WHERE name = 'Cups'),
    'Vanilla Cup 100ml',
    'Creamy vanilla single cup.',
    28, 32, 'CUP-VAN-100',
    180, TRUE, 12.50, NULL, 24
  ),
  (
    (SELECT id FROM categories WHERE name = 'Cups'),
    'Rose Cup 100ml',
    'Gulkand rose flavour cup.',
    32, 38, 'CUP-ROSE-100',
    150, TRUE, 15.79, NULL, 24
  ),

  -- Cones
  (
    (SELECT id FROM categories WHERE name = 'Cones'),
    'Choco Dip Cone',
    'Chocolate-coated waffle cone.',
    25, 30, 'CONE-CHOCO-DIP',
    120, TRUE, 16.67, NULL, 12
  ),
  (
    (SELECT id FROM categories WHERE name = 'Cones'),
    'Mango Cone',
    'Mango ice cream in crisp cone.',
    20, 25, 'CONE-MANGO',
    100, TRUE, 20.00, 'Buy 12 Get 1 Free', 12
  ),
  (
    (SELECT id FROM categories WHERE name = 'Cones'),
    'Classic Vanilla Cone',
    'Everyday vanilla cone for quick sales.',
    15, 18, 'CONE-VANILLA',
    200, TRUE, 16.67, NULL, 12
  ),

  -- Candies
  (
    (SELECT id FROM categories WHERE name = 'Candies'),
    'Choco Bar Mini',
    'Mini chocolate ice candy bar.',
    10, 12, 'CANDY-CHOCO-MINI',
    500, TRUE, 16.67, NULL, 50
  ),
  (
    (SELECT id FROM categories WHERE name = 'Candies'),
    'Orange Lolly',
    'Refreshing orange ice lolly.',
    8, 10, 'CANDY-ORANGE',
    400, TRUE, 20.00, NULL, 50
  ),
  (
    (SELECT id FROM categories WHERE name = 'Candies'),
    'Kulfi Stick Malai',
    'Traditional malai kulfi on stick.',
    15, 18, 'CANDY-KULFI-MALAI',
    300, TRUE, 16.67, 'Buy 50 Get 5 Free', 50
  ),

  -- Family Packs
  (
    (SELECT id FROM categories WHERE name = 'Family Packs'),
    'Family Feast 2L Assorted',
    '2 litre party pack — vanilla, mango, chocolate swirls.',
    220, 260, 'FAM-FEAST-2L',
    30, TRUE, 15.38, NULL, 1
  ),
  (
    (SELECT id FROM categories WHERE name = 'Family Packs'),
    'Weekend Special 1.5L',
    '1.5L dual flavour tub for families.',
    175, 200, 'FAM-WEEKEND-1.5',
    35, TRUE, 12.50, NULL, 1
  ),

  -- Bulk Packs
  (
    (SELECT id FROM categories WHERE name = 'Bulk Packs'),
    'Bulk Vanilla 4L',
    '4 litre vanilla for distributors. MOQ 5 units.',
    380, 450, 'BULK-VAN-4L',
    20, TRUE, 15.56, 'Buy 5 Get 1 Free', 5
  ),
  (
    (SELECT id FROM categories WHERE name = 'Bulk Packs'),
    'Bulk Mango 4L',
    '4 litre mango for high-volume outlets.',
    400, 470, 'BULK-MANGO-4L',
    18, TRUE, 14.89, 'Buy 5 Get 1 Free', 5
  ),
  (
    (SELECT id FROM categories WHERE name = 'Bulk Packs'),
    'Bulk Mixed Case 10L',
    '10 litre commercial case — contact for flavours.',
    950, 1100, 'BULK-MIX-10L',
    10, TRUE, 13.64, NULL, 2
  ),

  -- One hidden product (admin can toggle on)
  (
    (SELECT id FROM categories WHERE name = 'Tubs'),
    'Seasonal Jackfruit Tub 1L',
    'Limited seasonal jackfruit flavour.',
    135, 155, 'TUB-JACK-1L',
    15, FALSE, 12.90, NULL, 1
  )
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  mrp = EXCLUDED.mrp,
  stock_quantity = EXCLUDED.stock_quantity,
  is_available = EXCLUDED.is_available,
  discount_percent = EXCLUDED.discount_percent,
  scheme_label = EXCLUDED.scheme_label,
  purchase_quantity = EXCLUDED.purchase_quantity,
  category_id = EXCLUDED.category_id;

-- ============================================
-- VERIFY
-- ============================================
-- SELECT c.name, COUNT(p.id) FROM categories c
-- LEFT JOIN products p ON p.category_id = c.id
-- GROUP BY c.name ORDER BY c.display_order;
