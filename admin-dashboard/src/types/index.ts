// Auth
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_verified: boolean;
  role?: { name: string };
  avatar_url?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Products
export interface ProductOption {
  id: string;
  name: string;
  value: string;
  price_modifier: number;
  stock: number;
}

export interface ProductImage {
  id: string;
  url: string;
  public_id: string;
  alt_text?: string;
  is_primary: boolean;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  discount_price?: number;
  stock: number;
  category?: string;
  slug: string;
  is_active: boolean;
  images: ProductImage[];
  options: ProductOption[];
  average_rating?: number;
  reviews_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductCreate {
  name: string;
  description?: string;
  price: number;
  discount_price?: number;
  stock: number;
  category?: string;
  slug?: string;
  is_active?: boolean;
}

// Orders
export type OrderStatus = 'pending_payment' | 'payment_discussion' | 'paid' | 'cancelled';

export interface OrderItem {
  id: string;
  product_id: string;
  product_option_id?: string;
  quantity: number;
  unit_price: number;
  product_name: string;
  selected_options?: { name: string; value: string; price_modifier: number } | null;
}

export interface ShippingAddress {
  full_name: string;
  phone?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code?: string;
  country: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  shipping_address?: ShippingAddress;
  payment_method?: string;
  notes?: string;
  invoice_url?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

// Messages
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  sender_name?: string;
  created_at: string;
}

export interface ConversationSummary {
  user_id: string;
  user_name: string;
  user_email: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

// Admin Stats
export interface AdminStats {
  total_orders: number;
  total_revenue: number;
  total_users: number;
  total_products: number;
  orders_today: number;
}

// Admin User
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  created_at: string;
  orders_count: number;
}

// Pagination
export interface PaginationParams {
  page?: number;
  per_page?: number;
}
