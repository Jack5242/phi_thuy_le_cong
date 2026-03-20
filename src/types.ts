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

export type View = 'home' | 'collections' | 'detail' | 'cart' | 'auth' | 'profile' | 'checkout' | 'admin' | 'blog' | 'blog-detail' | 'reset-password' | 'feedback' | 'about' | 'contact' | 'shopping-guide' | 'return-policy' | 'faq' | 'privacy-policy' | 'terms-of-service';
