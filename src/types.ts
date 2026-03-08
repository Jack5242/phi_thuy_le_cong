export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  collection: string;
  image: string;
  images?: string[];
  isNew?: boolean;
  isPremium?: boolean;
  isBestSeller?: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
}

export type View = 'home' | 'collections' | 'detail' | 'cart' | 'auth' | 'profile' | 'checkout' | 'admin';
