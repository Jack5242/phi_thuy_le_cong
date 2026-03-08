/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { View, Product, User } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { HomeView } from './views/HomeView';
import { CollectionsView } from './views/CollectionsView';
import { ProductDetailView } from './views/ProductDetailView';
import { CartView } from './views/CartView';
import { AuthView } from './views/AuthView';
import { ProfileView } from './views/ProfileView';
import { CheckoutView } from './views/CheckoutView';
import { AdminView } from './views/AdminView';
import { motion, AnimatePresence } from 'motion/react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(() => {
    const path = window.location.pathname;
    if (path === '/admin') return 'admin';
    if (path === '/cart') return 'cart';
    if (path === '/collections') return 'collections';
    if (path === '/auth') return 'auth';
    if (path === '/profile') return 'profile';
    return 'home';
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number; type: 'percent' | 'fixed' } | null>(null);
  const [checkoutFormData, setCheckoutFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.address || '',
    notes: '',
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showToast, setShowToast] = useState(false);

  const fetchProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch products:', err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
    
    // Listen for popstate events (browser back/forward buttons)
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (currentPath === '/admin') setCurrentView('admin');
      else if (currentPath === '/cart') setCurrentView('cart');
      else if (currentPath === '/collections') setCurrentView('collections');
      else if (currentPath === '/auth') setCurrentView('auth');
      else if (currentPath === '/profile') setCurrentView('profile');
      else setCurrentView('home');
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update URL when view changes
  useEffect(() => {
    const path = currentView === 'home' ? '/' : `/${currentView}`;
    if (window.location.pathname !== path && currentView !== 'detail' && currentView !== 'checkout') {
      window.history.pushState({}, '', path);
    }
    window.scrollTo(0, 0);
  }, [currentView]);

  // Redirect from auth to profile if already logged in
  useEffect(() => {
    if (currentView === 'auth' && isLoggedIn) {
      setCurrentView('profile');
    }
  }, [currentView, isLoggedIn]);

  // Update checkout form data when user logs in
  useEffect(() => {
    if (user) {
      setCheckoutFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        phone: user.phone || prev.phone,
        email: user.email || prev.email,
        address: user.address || prev.address,
      }));
    }
  }, [user]);

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setShowToast(true);
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCartItems(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedVoucher(null);
  };

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const shipping = subtotal > 2000 ? 0 : 50;
    
    let discountAmount = 0;
    if (appliedVoucher) {
      if (appliedVoucher.type === 'percent') {
        discountAmount = subtotal * appliedVoucher.discount;
      } else {
        discountAmount = appliedVoucher.discount;
      }
    }
    
    return Math.max(0, subtotal - discountAmount + shipping);
  };

  const handleLogin = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    setIsLoggedIn(true);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setIsLoggedIn(false);
    setCartItems([]);
    setAppliedVoucher(null);
    setCheckoutFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
    });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentView('home');
  };

  const renderView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <span className="material-symbols-outlined animate-spin text-4xl text-jade-900">progress_activity</span>
        </div>
      );
    }

    switch (currentView) {
      case 'home':
        return <HomeView setView={setCurrentView} setSelectedProduct={setSelectedProduct} products={products} />;
      case 'collections':
        return <CollectionsView setView={setCurrentView} setSelectedProduct={setSelectedProduct} products={products} searchQuery={searchQuery} />;
      case 'detail':
        return selectedProduct ? (
          <ProductDetailView 
            product={selectedProduct} 
            addToCart={addToCart} 
            setView={setCurrentView} 
            setSelectedProduct={setSelectedProduct}
            products={products}
          />
        ) : <HomeView setView={setCurrentView} setSelectedProduct={setSelectedProduct} products={products} />;
      case 'cart':
        return (
          <CartView 
            cartItems={cartItems} 
            removeFromCart={removeFromCart} 
            updateQuantity={updateQuantity}
            setView={setCurrentView}
            appliedVoucher={appliedVoucher}
            setAppliedVoucher={setAppliedVoucher}
            checkoutFormData={checkoutFormData}
            setCheckoutFormData={setCheckoutFormData}
            user={user}
          />
        );
      case 'checkout':
        return (
          <CheckoutView 
            setView={setCurrentView} 
            totalAmount={calculateTotal()} 
            clearCart={clearCart} 
            cartItems={cartItems}
            user={user}
            appliedVoucher={appliedVoucher}
            checkoutFormData={checkoutFormData}
          />
        );
      case 'admin':
        return (
          <AdminView 
            setView={setCurrentView} 
            products={products} 
            refreshProducts={fetchProducts} 
          />
        );
      case 'auth':
        return <AuthView setView={setCurrentView} onLogin={handleLogin} />;
      case 'profile':
        return isLoggedIn && user && token ? (
          <ProfileView onLogout={handleLogout} setView={setCurrentView} user={user} token={token} />
        ) : <AuthView setView={setCurrentView} onLogin={handleLogin} />;
      default:
        return <HomeView setView={setCurrentView} setSelectedProduct={setSelectedProduct} products={products} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar 
        currentView={currentView} 
        setView={setCurrentView} 
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)} 
        isLoggedIn={isLoggedIn}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      
      <main className="flex-1 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />

      {showToast && (
        <Toast 
          message="Item added to cart!" 
          onClose={() => setShowToast(false)} 
        />
      )}
    </div>
  );
};

export default App;
