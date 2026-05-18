export type UserRole = "admin" | "customer";
export type OrderStatus = "pending" | "confirmed" | "delivered" | "cancelled";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  email: string | null;
  business_name: string | null;
  address: string | null;
  city: string | null;
  pincode: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  display_order: number;
  icon: string | null;
  is_active: boolean;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  mrp: number | null;
  image_url: string | null;
  sku: string | null;
  stock_quantity: number;
  is_available: boolean;
  discount_percent: number;
  scheme_label: string | null;
  purchase_quantity: number | null;
  category?: Category;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  status: OrderStatus;
  total_amount: number;
  discount_amount: number;
  net_amount: number;
  notes: string | null;
  placed_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
  customer?: Profile;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_price: number;
  quantity: number;
  line_total: number;
  product?: Product;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DashboardMetrics {
  total_orders: number;
  total_order_value: number;
  pending_orders: number;
  pending_order_value: number;
  confirmed_orders: number;
  delivered_orders: number;
}
