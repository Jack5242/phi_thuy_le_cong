export interface Product {
  id: string;
  name: string;
  name_en?: string;
  description: string;
  description_en?: string;
  price: number;
  category: string;
  collection: string;
  collection_en?: string;
  image: string;
  images?: string[];
  isNew?: boolean;
  isPremium?: boolean;
  isBestSeller?: boolean;
  amount?: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  total_spent?: number;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image?: string;
  author: string;
  created_at: string;
  is_published: boolean;
}

export interface Voucher {
  id: string;
  code: string;
  discount: number;
  type: 'percent' | 'fixed';
  is_active: boolean;
  usage_limit?: number;
  usage_count: number;
  min_user_spending: number;
  min_order_value: number;
  max_discount_amount?: number | null;
  user_email?: string;
  is_registration: boolean;
  is_hidden: boolean;
}

export type View = 'home' | 'collections' | 'detail' | 'cart' | 'auth' | 'profile' | 'checkout' | 'admin' | 'blog' | 'blog-detail' | 'reset-password' | 'feedback' | 'about' | 'contact' | 'shopping-guide' | 'return-policy' | 'faq' | 'privacy-policy' | 'terms-of-service';
