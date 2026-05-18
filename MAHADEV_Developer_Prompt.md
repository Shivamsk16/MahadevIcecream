# MAHADEV Enterprises — Ice Cream Ordering & Distribution Management System
## Complete Full-Stack Developer Prompt (Next.js + Supabase)

---

## 1. PROJECT OVERVIEW

Build a full-stack B2B Ice Cream Ordering & Distribution Management web application for **MAHADEV Enterprises**. The system digitizes the complete ice cream ordering and distribution workflow for customers (retailers/distributors), and provides a powerful admin portal for product management, order tracking, and sales analytics.

**Brand Identity:**
- Company: MAHADEV Enterprises
- Primary Color: Red (`#CC0000` / `#E53935`)
- Theme: Professional, warm, bold — red + white + dark grey
- Logo: Company logo displayed on landing page and header

---

## 2. TECH STACK

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (OTP + Email/Password) |
| Storage | Supabase Storage (product images) |
| Realtime | Supabase Realtime (dashboard updates) |
| State | Zustand (cart state) |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Charts | Recharts |
| Deployment | Vercel |

---

## 3. USER ROLES & ACCESS

### 3.1 Customer (B2B Retailer)
- Dual login: Phone OTP **or** username/password (admin-pre-registered)
- Can browse products, manage cart, place orders
- Can view own order history

### 3.2 Admin
- Email/password login (Supabase Auth)
- Full access: product management, all orders, sales dashboard, customer management
- Can pre-register customers

### 3.3 Public
- Landing page only (no product browsing without login)

---

## 4. SUPABASE DATABASE SCHEMA

Run the following SQL in your Supabase SQL editor to set up all tables, RLS policies, and triggers.

```sql
-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'delivered', 'cancelled');
CREATE TYPE user_role AS ENUM ('admin', 'customer');

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'customer',
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  business_name TEXT,
  address TEXT,
  city TEXT,
  pincode TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),  -- admin who registered this customer
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CATEGORIES TABLE
-- ============================================

CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,           -- 'Tubs', 'Cups', 'Cones', 'Candies', 'Family Packs', 'Bulk Packs'
  display_order INT DEFAULT 0,
  icon TEXT,                           -- emoji or icon name
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default categories
INSERT INTO categories (name, display_order, icon) VALUES
  ('Tubs', 1, '🍨'),
  ('Cups', 2, '🥤'),
  ('Cones', 3, '🍦'),
  ('Candies', 4, '🍭'),
  ('Family Packs', 5, '👨‍👩‍👧‍👦'),
  ('Bulk Packs', 6, '📦');

-- ============================================
-- PRODUCTS TABLE
-- ============================================

CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  mrp DECIMAL(10, 2),                  -- original MRP for displaying discount
  image_url TEXT,
  sku TEXT UNIQUE,
  stock_quantity INT DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,   -- admin can hide/show
  discount_percent DECIMAL(5, 2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  scheme_label TEXT,                   -- e.g. "Buy 10 Get 1 Free"
  purchase_quantity INT,               -- minimum purchase quantity
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDERS TABLE
-- ============================================

CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,   -- human-readable e.g. "ORD-20240115-001"
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status order_status DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  net_amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  placed_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================

CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,          -- snapshot at time of order
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  line_total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDER NUMBER GENERATOR FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  today TEXT;
  seq INT;
  order_num TEXT;
BEGIN
  today := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO seq
  FROM orders
  WHERE DATE(placed_at) = CURRENT_DATE;
  order_num := 'ORD-' || today || '-' || LPAD(seq::TEXT, 3, '0');
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_order
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- CATEGORIES (public read, admin write)
CREATE POLICY "Anyone authenticated can read categories" ON categories FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- PRODUCTS (customers see available only, admins see all)
CREATE POLICY "Customers see available products" ON products FOR SELECT USING (
  is_available = TRUE
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ORDERS
CREATE POLICY "Customers can view own orders" ON orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Customers can insert orders" ON orders FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update orders" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ORDER ITEMS
CREATE POLICY "Customers can view own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND customer_id = auth.uid())
);
CREATE POLICY "Customers can insert order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND customer_id = auth.uid())
);
CREATE POLICY "Admins can view all order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- SUPABASE STORAGE BUCKET
-- ============================================
-- Run in Supabase Dashboard > Storage:
-- Create bucket named: "product-images" (Public)
-- Set max file size: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp
```

---

## 5. SUPABASE CONFIGURATION

### 5.1 Authentication Settings (Supabase Dashboard)
1. **Enable Phone Auth**: Authentication > Providers > Phone → Enable, add Twilio/Vonage keys
2. **Enable Email Auth**: Already enabled by default
3. **Disable email confirmation** for admin-created customers (programmatic creation)
4. **Add site URL** and redirect URLs in Auth settings

### 5.2 Environment Variables (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Server-side only, never expose
```

### 5.3 Supabase Client Setup

**`/lib/supabase/client.ts`** — Browser client
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`/lib/supabase/server.ts`** — Server client (for Server Components, Route Handlers)
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
        set(name, value, options) { cookieStore.set({ name, value, ...options }) },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  )
}
```

**`/lib/supabase/admin.ts`** — Admin client (server-side only, bypasses RLS)
```ts
import { createClient } from '@supabase/supabase-js'

export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

---

## 6. PROJECT FOLDER STRUCTURE

```
mahadev-app/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx               # Dual login: OTP or username/password
│   │   ├── verify-otp/
│   │   │   └── page.tsx               # OTP verification screen
│   │   └── layout.tsx                 # Auth layout (centered card, no navbar)
│   │
│   ├── (customer)/
│   │   ├── layout.tsx                 # Customer layout (header + bottom nav)
│   │   ├── home/
│   │   │   └── page.tsx               # Landing: logo, banner, category grid
│   │   ├── products/
│   │   │   └── page.tsx               # Product listing with search + filter
│   │   ├── cart/
│   │   │   └── page.tsx               # Cart management + place order
│   │   ├── orders/
│   │   │   └── page.tsx               # Customer's own order history
│   │   └── profile/
│   │       └── page.tsx               # Customer profile settings
│   │
│   ├── (admin)/
│   │   ├── layout.tsx                 # Admin layout (sidebar nav)
│   │   ├── dashboard/
│   │   │   └── page.tsx               # Sales dashboard with realtime metrics
│   │   ├── products/
│   │   │   ├── page.tsx               # Product list (all) with CRUD
│   │   │   ├── new/
│   │   │   │   └── page.tsx           # Add new product form
│   │   │   └── [id]/
│   │   │       └── page.tsx           # Edit product form
│   │   ├── orders/
│   │   │   ├── page.tsx               # All orders with filter/search
│   │   │   └── [id]/
│   │   │       └── page.tsx           # Order detail view + status update
│   │   ├── customers/
│   │   │   ├── page.tsx               # Customer list with purchase history
│   │   │   └── new/
│   │   │       └── page.tsx           # Pre-register a customer
│   │   └── categories/
│   │       └── page.tsx               # Category management
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts           # Supabase OAuth/OTP callback handler
│   │   ├── customers/
│   │   │   └── route.ts               # POST: Admin creates customer (uses service role)
│   │   └── orders/
│   │       └── route.ts               # POST: Place order (server action)
│   │
│   ├── layout.tsx                     # Root layout
│   ├── page.tsx                       # Root redirect (/ → login or home based on role)
│   └── middleware.ts                  # Route protection
│
├── components/
│   ├── ui/                            # shadcn/ui components (auto-generated)
│   ├── layout/
│   │   ├── CustomerHeader.tsx
│   │   ├── CustomerBottomNav.tsx
│   │   ├── AdminSidebar.tsx
│   │   └── AdminTopBar.tsx
│   ├── products/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── CategoryFilter.tsx
│   │   ├── SearchBar.tsx
│   │   └── ProductForm.tsx            # Add/Edit product form (admin)
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   └── CartBadge.tsx
│   ├── orders/
│   │   ├── OrderCard.tsx
│   │   ├── OrderStatusBadge.tsx
│   │   └── OrderDetail.tsx
│   ├── dashboard/
│   │   ├── MetricCard.tsx
│   │   ├── SalesChart.tsx
│   │   └── RecentOrdersTable.tsx
│   └── shared/
│       ├── LoadingSpinner.tsx
│       ├── EmptyState.tsx
│       └── ConfirmDialog.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── actions/
│   │   ├── auth.actions.ts            # Server Actions for auth
│   │   ├── product.actions.ts         # Server Actions for product CRUD
│   │   ├── order.actions.ts           # Server Actions for order placement
│   │   └── customer.actions.ts        # Server Actions for customer management
│   ├── hooks/
│   │   ├── useCart.ts                 # Zustand cart store + hook
│   │   ├── useAuth.ts                 # Current user + role
│   │   └── useRealtimeDashboard.ts    # Supabase realtime subscription
│   ├── types/
│   │   └── index.ts                   # All TypeScript types/interfaces
│   └── utils/
│       ├── formatCurrency.ts
│       ├── formatDate.ts
│       └── imageUpload.ts             # Supabase Storage helpers
│
├── public/
│   ├── logo.png                       # MAHADEV logo
│   └── banner.jpg                     # Hero banner
│
├── middleware.ts                      # Auth + role-based route protection
├── tailwind.config.ts
├── next.config.js
└── package.json
```

---

## 7. TYPESCRIPT TYPES

**`/lib/types/index.ts`**
```ts
export type UserRole = 'admin' | 'customer'
export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  phone: string | null
  email: string | null
  business_name: string | null
  address: string | null
  city: string | null
  pincode: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  display_order: number
  icon: string | null
  is_active: boolean
}

export interface Product {
  id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  mrp: number | null
  image_url: string | null
  sku: string | null
  stock_quantity: number
  is_available: boolean
  discount_percent: number
  scheme_label: string | null
  purchase_quantity: number | null
  category?: Category
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  customer_id: string
  status: OrderStatus
  total_amount: number
  discount_amount: number
  net_amount: number
  notes: string | null
  placed_at: string
  confirmed_at: string | null
  delivered_at: string | null
  customer?: Profile
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  product_price: number
  quantity: number
  line_total: number
  product?: Product
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface DashboardMetrics {
  total_orders: number
  total_order_value: number
  pending_orders: number
  pending_order_value: number
  confirmed_orders: number
  delivered_orders: number
}
```

---

## 8. MIDDLEWARE (Route Protection)

**`/middleware.ts`**
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value },
        set(name, value, options) { response.cookies.set({ name, value, ...options }) },
        remove(name, options) { response.cookies.set({ name, value: '', ...options }) },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Unauthenticated → redirect to login
  if (!user && !pathname.startsWith('/login') && !pathname.startsWith('/verify-otp')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Authenticated user trying to access auth pages → redirect to home
  if (user && (pathname === '/login' || pathname === '/verify-otp')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role
    return NextResponse.redirect(new URL(role === 'admin' ? '/dashboard' : '/home', request.url))
  }

  // Protect admin routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/products') ||
      pathname.startsWith('/orders') || pathname.startsWith('/customers') ||
      pathname.startsWith('/categories')) {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role !== 'admin') {
        return NextResponse.redirect(new URL('/home', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
}
```

---

## 9. AUTHENTICATION FLOWS

### 9.1 Customer Login — Phone OTP
```
1. Customer enters phone number on /login (selects "Login with OTP" tab)
2. App calls: supabase.auth.signInWithOtp({ phone: '+91XXXXXXXXXX' })
3. Supabase sends OTP via SMS
4. Customer redirected to /verify-otp
5. Customer enters 6-digit OTP
6. App calls: supabase.auth.verifyOtp({ phone, token, type: 'sms' })
7. On success → profile lookup:
   - If profile exists (admin pre-registered) → set session → redirect to /home
   - If no profile → create profile with role='customer' → redirect to /home
```

### 9.2 Customer Login — Username/Password (Admin Pre-registered)
```
1. Admin creates customer: POST /api/customers (server-side, uses service role key)
   - Creates auth.users entry with email/password via adminClient.auth.admin.createUser()
   - Creates profiles entry with role='customer'
   - Admin can share credentials securely with customer
2. Customer enters email + password on /login (selects "Login with Password" tab)
3. App calls: supabase.auth.signInWithPassword({ email, password })
4. On success → redirect to /home
```

### 9.3 Admin Pre-Register Customer API Route
**`/app/api/customers/route.ts`**
```ts
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Verify requester is admin
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { full_name, email, password, phone, business_name, address, city, pincode } = body

  // Create auth user
  const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    phone,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  // Create profile
  const { error: profileError } = await adminClient.from('profiles').insert({
    id: newUser.user.id,
    role: 'customer',
    full_name,
    email,
    phone,
    business_name,
    address,
    city,
    pincode,
    created_by: user.id,
  })

  if (profileError) {
    await adminClient.auth.admin.deleteUser(newUser.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, user_id: newUser.user.id }, { status: 201 })
}
```

---

## 10. PAGES — DETAILED SPECIFICATION

---

### 10.1 Login Page (`/login`)

**Design:** Full-screen page. MAHADEV logo top-center. Red gradient background or white card on red. Two tabs: "OTP Login" | "Password Login".

**OTP Login Tab:**
- Phone number input (with +91 prefix)
- "Send OTP" button → calls `supabase.auth.signInWithOtp`
- On success → navigate to `/verify-otp?phone=XXXXXXXXXX`

**Password Login Tab:**
- Email input
- Password input
- "Login" button → calls `supabase.auth.signInWithPassword`
- Error handling: "Invalid credentials" message

**Validation:** React Hook Form + Zod
- Phone: 10 digits, Indian format
- Email: valid email format
- Password: min 6 characters

---

### 10.2 OTP Verify Page (`/verify-otp`)

- Display masked phone number
- 6-digit OTP input (use `InputOTP` from shadcn/ui)
- "Verify" button → calls `supabase.auth.verifyOtp`
- "Resend OTP" (30-second countdown timer)
- On success → redirect to `/home`

---

### 10.3 Customer Home (`/home`)

**Design:** Mobile-first. Top section: MAHADEV logo + welcome message "Welcome, [Customer Name]!". Red hero banner. Below: category cards grid (2×3).

**Category Cards:**
- Icon (emoji) + Category name
- On click → `/products?category=CATEGORY_NAME`
- Cards: Tubs, Cups, Cones, Candies, Family Packs, Bulk Packs

**Header Component:**
- MAHADEV logo (left)
- Cart icon with item count badge (right) → `/cart`

**Bottom Navigation:**
- Home | Products | Cart | Orders | Profile

---

### 10.4 Products Page (`/products`)

**Data Fetching:** Server component. Fetch all `is_available = true` products. Pass category from URL query param.

**UI Elements:**
- Search bar (client-side filter)
- Category filter pills (horizontal scroll)
- Product grid (2 columns on mobile, 3-4 on desktop)

**Product Card:**
```
┌─────────────────────────┐
│   [Product Image]        │
│   Scheme badge (if any) │
│ Name                    │
│ ₹Price  MRP ~~strike~~  │
│ [− 1 +]  [Add to Cart]  │
└─────────────────────────┘
```
- Quantity selector shows when item is in cart
- "Add to Cart" button updates Zustand cart store
- Out-of-stock / unavailable products hidden entirely

---

### 10.5 Cart Page (`/cart`)

**UI Layout:**
```
Cart (3 items)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Image] Mango Tub         ₹120
         [−] 2 [+]        ₹240
─────────────────────────────
[Image] Choco Cup          ₹60
         [−] 1 [+]         ₹60
─────────────────────────────
Subtotal                  ₹300
Discount                  − ₹0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                     ₹300
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[      Place Order      ]
```

**Behavior:**
- Quantity changes update Zustand store and recalculate total in real-time
- "Remove" (trash icon) per item
- Empty cart state with "Browse Products" CTA
- "Place Order" button → calls order Server Action

**Place Order Flow:**
1. Validate cart not empty
2. Show confirmation dialog ("Confirm Order — ₹300?")
3. Server Action: create `orders` row + `order_items` rows in Supabase
4. Clear cart in Zustand
5. Show success toast: "Order #ORD-20240115-001 placed!"
6. Redirect to `/orders`

---

### 10.6 Customer Orders Page (`/orders`)

- List of customer's own orders (most recent first)
- Each card: Order #, Date, Status badge, Item count, Total
- Status badge colors: Pending=yellow, Confirmed=blue, Delivered=green, Cancelled=red
- Click card → expand to show order items

---

### 10.7 Customer Profile Page (`/profile`)

- Display: Name, Phone, Email, Business Name, Address
- "Edit Profile" → editable form (address, business name only; phone/email non-editable)
- "Logout" button → `supabase.auth.signOut()` → redirect to `/login`

---

### 10.8 Admin Dashboard (`/dashboard`)

**Design:** Sidebar layout. Page title: "Sales Dashboard". Real-time auto-refresh via Supabase Realtime.

**Metric Cards (top row):**
```
┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ Total Orders   │ │ Total Value    │ │ Pending Orders │ │ Delivered      │
│   47           │ │  ₹1,24,500     │ │   12           │ │   28           │
│ Today          │ │ Today          │ │ Action needed  │ │ Today          │
└────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘
```

**Charts Section:**
- Bar chart: Orders per day (last 7 days) — using Recharts
- Pie chart: Orders by category — using Recharts

**Recent Orders Table:**
- Columns: Order #, Customer, Items, Amount, Status, Time, Actions
- Action: Update status dropdown (Pending → Confirmed → Delivered / Cancelled)
- Click row → `/orders/[id]`

**Realtime Setup:**
```ts
// useRealtimeDashboard.ts
supabase
  .channel('orders-channel')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchMetrics)
  .subscribe()
```

---

### 10.9 Admin Products Page (`/products`)

**List View:**
- Table with columns: Image, Name, Category, Price, Discount, Available toggle, Actions
- Search bar + category filter
- "Add Product" button → `/products/new`

**Availability Toggle:**
- Toggle switch (on/off) per product row
- On toggle → instant update to `is_available` in Supabase

**Actions per row:**
- Edit → `/products/[id]`
- Delete → Confirm dialog → soft delete or hard delete

---

### 10.10 Admin Add/Edit Product (`/products/new` and `/products/[id]`)

**Form Fields:**
```
Product Name *          [text input]
Category *              [select dropdown]
Price (₹) *             [number input]
MRP (₹)                 [number input]
Discount %              [number input 0-100]
Scheme Label            [text input] e.g. "Buy 10 Get 1 Free"
Min Purchase Qty        [number input]
Description             [textarea]
Product Image *         [file upload → Supabase Storage]
Is Available            [toggle]
```

**Image Upload:**
```ts
// Upload to Supabase Storage
const { data, error } = await supabase.storage
  .from('product-images')
  .upload(`products/${Date.now()}-${file.name}`, file)

const { data: { publicUrl } } = supabase.storage
  .from('product-images')
  .getPublicUrl(data.path)
```

**Validation:** All required fields via Zod. Price must be > 0.

---

### 10.11 Admin Orders Page (`/orders`)

**Filters:**
- Status filter: All | Pending | Confirmed | Delivered | Cancelled
- Date range picker
- Search by customer name or order number

**Order List:**
- Table: Order #, Customer, Date, Items, Amount, Status, Action
- Status update inline dropdown

---

### 10.12 Admin Order Detail (`/orders/[id]`)

```
Order #ORD-20240115-001       Status: [Pending ▼]
Customer: Ramesh Traders
Phone: 9876543210
Placed: 15 Jan 2024, 10:32 AM

ITEMS:
─────────────────────────────────────────
Product         Qty    Price    Total
─────────────────────────────────────────
Mango Tub 1L    5      ₹120     ₹600
Choco Cup       10     ₹30      ₹300
─────────────────────────────────────────
                        TOTAL   ₹900
─────────────────────────────────────────

[Update Status]   [Print / Download]
```

---

### 10.13 Admin Customers Page (`/customers`)

**Table columns:**
- Name, Business, Phone, City, Orders (count), Total Purchases (₹), Last Order, Status, Actions

**Analytics per customer (expandable row or modal):**
- Previous month purchases (count + value)
- Current month purchases (count + value)
- Average order value

**"Add Customer" button → `/customers/new`**

---

### 10.14 Admin Add Customer (`/customers/new`)

**Form Fields:**
```
Full Name *             [text]
Business Name           [text]
Email *                 [email] — used for password login
Phone                   [text] — used for OTP login
Password *              [password, min 8 chars]
Address                 [textarea]
City                    [text]
Pincode                 [text]
```

**On Submit:**
- POST to `/api/customers`
- Shows generated credentials to admin (email + password)
- Option to copy credentials

---

## 11. CART STATE MANAGEMENT (Zustand)

**`/lib/hooks/useCart.ts`**
```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from '@/lib/types'

interface CartStore {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  totalAmount: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const existing = get().items.find(i => i.product.id === product.id)
        if (existing) {
          set(state => ({
            items: state.items.map(i =>
              i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          }))
        } else {
          set(state => ({ items: [...state.items, { product, quantity: 1 }] }))
        }
      },
      removeItem: (productId) => set(state => ({
        items: state.items.filter(i => i.product.id !== productId)
      })),
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set(state => ({
          items: state.items.map(i =>
            i.product.id === productId ? { ...i, quantity } : i
          )
        }))
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalAmount: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    }),
    { name: 'mahadev-cart' }
  )
)
```

---

## 12. SERVER ACTIONS

### Order Placement (`/lib/actions/order.actions.ts`)
```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { CartItem } from '@/lib/types'
import { revalidatePath } from 'next/cache'

export async function placeOrder(cartItems: CartItem[], notes?: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const total_amount = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: user.id,
      status: 'pending',
      total_amount,
      discount_amount: 0,
      net_amount: total_amount,
      notes,
    })
    .select()
    .single()

  if (orderError) throw new Error(orderError.message)

  // Create order items
  const orderItems = cartItems.map(item => ({
    order_id: order.id,
    product_id: item.product.id,
    product_name: item.product.name,
    product_price: item.product.price,
    quantity: item.quantity,
    line_total: item.product.price * item.quantity,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) throw new Error(itemsError.message)

  revalidatePath('/orders')
  revalidatePath('/dashboard')

  return { success: true, order_number: order.order_number }
}
```

---

## 13. TAILWIND CONFIG (MAHADEV Brand Theme)

**`/tailwind.config.ts`**
```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff1f1',
          100: '#ffe1e1',
          200: '#ffc7c7',
          300: '#ff9f9f',
          400: '#ff6666',
          500: '#ff3333',
          600: '#E53935',   // Primary brand red
          700: '#CC0000',   // Darker red
          800: '#a50000',
          900: '#7a0000',
        },
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'sans-serif'],
        display: ['var(--font-playfair)', 'serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
```

**Fonts in `app/layout.tsx`:**
```ts
import { Poppins, Playfair_Display } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})
```

---

## 14. PACKAGE.JSON DEPENDENCIES

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    "@supabase/ssr": "^0.3.0",
    "@supabase/supabase-js": "^2.43.0",
    "zustand": "^4.5.0",
    "react-hook-form": "^7.51.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.23.0",
    "recharts": "^2.12.0",
    "lucide-react": "^0.378.0",
    "tailwindcss": "^3.4.0",
    "tailwindcss-animate": "^1.0.7",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0",
    "date-fns": "^3.6.0",
    "sonner": "^1.4.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "^14",
    "autoprefixer": "^10",
    "postcss": "^8"
  }
}
```

---

## 15. SETUP & INSTALLATION COMMANDS

```bash
# 1. Create Next.js project
npx create-next-app@latest mahadev-app --typescript --tailwind --app --src-dir=no

# 2. Install dependencies
cd mahadev-app
npm install @supabase/ssr @supabase/supabase-js zustand react-hook-form @hookform/resolvers zod recharts lucide-react date-fns sonner tailwind-merge clsx tailwindcss-animate

# 3. Install shadcn/ui
npx shadcn-ui@latest init
# Add components as needed:
npx shadcn-ui@latest add button input label badge card dialog toast tabs select switch table avatar dropdown-menu

# 4. Configure environment
cp .env.example .env.local
# Add your Supabase URL and keys

# 5. Run Supabase SQL (from schema in section 4)
# Paste into Supabase Dashboard > SQL Editor > Run

# 6. Run dev server
npm run dev
```

---

## 16. PHASE 2 — OUT OF SCOPE (Future Reference)

The following features are explicitly deferred:
- **Distributor Invoice Generation** — quantity allocation, invoice PDF, WhatsApp confirmation to customer
- **Customer Location Tracking** — Google Maps integration, delivery tracking
- **Online Payments** — Razorpay / UPI integration
- **Loyalty Points** — purchase-based rewards
- **GST Billing** — tax invoice generation
- **Multi-language** — Hindi / regional language support
- **Daily WhatsApp Reminder** — "Did you place your ice cream order today?"
- **Mobile App** — React Native / Expo (use this web as base)

---

## 17. SECURITY CHECKLIST

- [ ] Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- [ ] All admin routes protected in `middleware.ts`
- [ ] RLS enabled on all Supabase tables
- [ ] Admin-only operations use server-side route handlers
- [ ] File uploads validate MIME type before uploading to storage
- [ ] Zod validation on all form submissions (client + server)
- [ ] Inactive customers (`is_active = false`) cannot log in (middleware check)

---

## 18. PERFORMANCE REQUIREMENTS

- Page load < 3 seconds → use Next.js Server Components, ISR where applicable
- Product images → use `next/image` with lazy loading and WebP format
- Dashboard realtime → Supabase channel subscription, not polling
- Cart state → persisted in localStorage via Zustand `persist` middleware

---

*End of Prompt — MAHADEV Enterprises Ice Cream Ordering & Distribution Management System v1.0*
