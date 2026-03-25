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
import { useLanguage } from './context/LanguageContext';
import { CollectionsView } from './views/CollectionsView';
import { ProductDetailView } from './views/ProductDetailView';
import { CartView } from './views/CartView';
import { AuthView } from './views/AuthView';
import { ZaloChatButton } from './components/ZaloChatButton';
import { ProfileView } from './views/ProfileView';
import { CheckoutView } from './views/CheckoutView';
import { AdminView } from './views/AdminView';
import { BlogListView } from './views/BlogListView';
import { BlogDetailView } from './views/BlogDetailView';
import { ResetPasswordView } from './views/ResetPasswordView';
import { AdminResetPasswordView } from './views/AdminResetPasswordView';
import { FeedbackView } from './views/FeedbackView';
import { AboutView } from './views/AboutView';
import { ContactView } from './views/ContactView';
import { ShoppingGuideView } from './views/ShoppingGuideView';
import { ReturnPolicyView } from './views/ReturnPolicyView';
import { FaqView } from './views/FaqView';
import { PrivacyPolicyView } from './views/PrivacyPolicyView';
import { TermsOfServiceView } from './views/TermsOfServiceView';
import { motion, AnimatePresence } from 'motion/react';

const generateSlug = (text: string) => {
  return text.toString().toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(() => {
    const path = window.location.pathname;
    if (path === '/admin') return 'admin';
    if (path === '/cart') return 'cart';
    if (path === '/collections') return 'collections';
    if (path === '/auth') return 'auth';
    if (path === '/profile') return 'profile';
    if (path === '/blog') return 'blog';
    if (path.startsWith('/product/')) return 'detail';
    
    // Parse query params for direct links
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'reset-password') return 'reset-password';
    if (viewParam === 'admin-reset-password') return 'admin-reset-password' as View;
    if (viewParam === 'feedback') return 'feedback';

    return 'home';
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<any>(null);
  const [cartItems, setCartItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [appliedVoucher, setAppliedVoucher] = useState<any | null>(null);
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
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const { t } = useLanguage();

  const fetchProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setIsLoading(false);
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/product/')) {
          const slugFromUrl = currentPath.replace('/product/', '');
          const product = data.find((p: any) => generateSlug(p.name) === slugFromUrl);
          if (product) setSelectedProduct(product);
        }
      })
      .catch(err => {
        console.error('Failed to fetch products:', err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Listen for popstate events (browser back/forward buttons)
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (currentPath === '/admin') setCurrentView('admin');
      else if (currentPath === '/cart') setCurrentView('cart');
      else if (currentPath === '/collections') setCurrentView('collections');
      else if (currentPath === '/auth') setCurrentView('auth');
      else if (currentPath === '/profile') setCurrentView('profile');
      else if (currentPath === '/blog') setCurrentView('blog');
      else if (currentPath.startsWith('/product/')) {
        setCurrentView('detail');
        const slugFromUrl = currentPath.replace('/product/', '');
        const product = products.find(p => generateSlug(p.name) === slugFromUrl);
        if (product) setSelectedProduct(product);
      }
      else {
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('view');
        if (viewParam === 'reset-password') setCurrentView('reset-password');
        else if (viewParam === 'admin-reset-password') setCurrentView('admin-reset-password' as View);
        else if (viewParam === 'feedback') setCurrentView('feedback');
        else setCurrentView('home');
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

  // Update URL when view changes
  useEffect(() => {
    let path = '/';
    let search = '';
    
    if (currentView === 'home') {
      path = '/';
    } else if (currentView === 'detail' && selectedProduct) {
      path = `/product/${generateSlug(selectedProduct.name)}`;
    } else if (currentView === 'blog-detail' && selectedBlog) {
      path = `/blog/${selectedBlog.slug}`;
    } else if (currentView === 'reset-password' || currentView === 'admin-reset-password' || currentView === 'feedback') {
      // Keep existing token/orderId query params if present, otherwise just set view param
      const existingParams = new URLSearchParams(window.location.search);
      existingParams.set('view', currentView);
      search = `?${existingParams.toString()}`;
    } else {
      path = `/${currentView}`;
    }
    
    const fullUrl = path + search;
    if (window.location.pathname + window.location.search !== fullUrl && currentView !== 'checkout') {
      window.history.pushState({}, '', fullUrl);
    }
    
    if (currentView !== 'reset-password' && currentView !== 'admin-reset-password' && currentView !== 'feedback') {
       window.scrollTo(0, 0);
    }
  }, [currentView, selectedBlog, selectedProduct]);

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
    
    let discountAmount = 0;
    if (appliedVoucher) {
      if (appliedVoucher.type === 'percent') {
        discountAmount = subtotal * appliedVoucher.discount;
        // Apply maximum discount amount cap if specified
        if (appliedVoucher.max_discount_amount) {
          discountAmount = Math.min(discountAmount, appliedVoucher.max_discount_amount);
        }
      } else {
        discountAmount = appliedVoucher.discount;
      }
    }
    
    return Math.max(0, subtotal - discountAmount);
  };

  const handleLogin = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    setIsLoggedIn(true);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleUpdateUser = (userData: User) => {
    setUser(userData);
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
          <span className="material-symbols-outlined animate-spin text-4xl text-teal-900">progress_activity</span>
        </div>
      );
    }

    switch (currentView) {
      case 'home':
        return <HomeView setView={setCurrentView} setSelectedProduct={setSelectedProduct} products={products} />;
      case 'collections':
        return <CollectionsView setView={setCurrentView} setSelectedProduct={setSelectedProduct} products={products} searchQuery={searchQuery} initialCategory={selectedCategory} onCategoryChange={setSelectedCategory} />;
      case 'detail':
        return selectedProduct ? (
          <ProductDetailView 
            product={selectedProduct} 
            addToCart={addToCart} 
            setView={setCurrentView} 
            setSelectedProduct={setSelectedProduct}
            products={products}
            user={user}
            token={token}
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
            onUpdateUser={handleUpdateUser}
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
          <ProfileView 
            onLogout={handleLogout} 
            setView={setCurrentView} 
            user={user} 
            token={token} 
            onUpdateUser={handleUpdateUser}
            setSelectedProduct={setSelectedProduct}
          />
        ) : <AuthView setView={setCurrentView} onLogin={handleLogin} />;
      case 'blog':
        return <BlogListView setView={setCurrentView} setSelectedBlog={setSelectedBlog} />;
      case 'blog-detail':
        return selectedBlog ? <BlogDetailView blog={selectedBlog} setView={setCurrentView} /> : <BlogListView setView={setCurrentView} setSelectedBlog={setSelectedBlog} />;
      case 'reset-password':
        return <ResetPasswordView setView={setCurrentView} />;
      case 'admin-reset-password':
        return <AdminResetPasswordView setView={setCurrentView} />;
      case 'feedback':
        return <FeedbackView setView={setCurrentView} />;
      case 'about':
        return <AboutView setView={setCurrentView} />;
      case 'contact':
        return <ContactView setView={setCurrentView} />;
      case 'shopping-guide':
        return <ShoppingGuideView setView={setCurrentView} />;
      case 'return-policy':
        return <ReturnPolicyView setView={setCurrentView} />;
      case 'faq':
        return <FaqView setView={setCurrentView} />;
      case 'privacy-policy':
        return <PrivacyPolicyView setView={setCurrentView} />;
      case 'terms-of-service':
        return <TermsOfServiceView setView={setCurrentView} />;
      default:
        return <HomeView setView={setCurrentView} products={products} setSelectedProduct={setSelectedProduct} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {currentView !== 'admin' && currentView !== 'admin-reset-password' && (
        <Navbar 
          currentView={currentView} 
          setView={setCurrentView} 
          cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)} 
          isLoggedIn={isLoggedIn}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setSelectedCategory={setSelectedCategory}
          user={user}
        />
      )}
      
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

      {currentView !== 'admin' && currentView !== 'admin-reset-password' && <Footer setView={setCurrentView} />}

      {showToast && (
        <Toast 
          message={t('cart.added')} 
          onClose={() => setShowToast(false)} 
        />
      )}
      
      {currentView !== 'admin' && currentView !== 'admin-reset-password' && <ZaloChatButton />}
    </div>
  );
};

export default App;
