export interface ProductImage {
  id: string;
  url: string;
  is_primary?: boolean;
}

export interface ProductOption {
  id: string;
  name: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  description?: string;
  category?: string;
  is_active?: boolean;
  stock?: number;
  images?: ProductImage[];
  options?: ProductOption[];
  average_rating?: number;
  reviews_count?: number;
  created_at?: string;
}

export interface CatalogResponse {
  items: Product[];
  total: number;
  page: number;
  per_page: number;
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: { name: string };
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOption?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
}
