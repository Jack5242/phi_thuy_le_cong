import React, { useState } from 'react';
import { Product, View } from '../types';
import { ProductCard } from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { Heart } from 'lucide-react';

interface ProductDetailViewProps {
  product: Product;
  addToCart: (product: Product) => void;
  setView: (view: View) => void;
  setSelectedProduct: (product: Product) => void;
  products: Product[];
  user?: any;
  token?: string | null;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({ product, addToCart, setView, setSelectedProduct, products, user, token }) => {
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'shipping'>('details');
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const { language, t } = useLanguage();
  const displayName = language === 'en' && product.name_en ? product.name_en : product.name;
  const displayDescription = language === 'en' && product.description_en ? product.description_en : product.description;

  const relatedProducts = products.filter(p => p.id !== product.id).slice(0, 4);

  const displayImages = product.images && product.images.length > 0 ? product.images : [product.image, product.image, product.image, product.image];

  const handleRelatedClick = (p: Product) => {
    setSelectedProduct(p);
    window.scrollTo(0, 0);
  };

  React.useEffect(() => {
    if (user && token && product) {
      fetch(`/api/users/wishlist/${product.id}/check`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setIsInWishlist(data.inWishlist))
      .catch(console.error);
    }
  }, [user, token, product]);

  const toggleWishlist = async () => {
    if (!user || !token) {
      setView('auth');
      return;
    }
    
    setIsWishlistLoading(true);
    try {
      if (isInWishlist) {
        await fetch(`/api/users/wishlist/${product.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setIsInWishlist(false);
      } else {
        await fetch(`/api/users/wishlist/${product.id}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error('Failed to toggle wishlist', error);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20 font-sans">
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
        <button onClick={() => setView('home')} className="hover:text-teal-900 transition-colors">{t('nav.home')}</button>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <button onClick={() => setView('collections')} className="hover:text-teal-900 transition-colors">{t('col.title')}</button>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-teal-900 font-bold">{displayName}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-12 mb-20">
        {/* Image Gallery */}
        <div className="w-full lg:w-1/2 space-y-4">
          <div className="aspect-[1/1] bg-teal-50 rounded-sm overflow-hidden shadow-sm">
            <img src={displayImages[activeImageIndex]} alt={displayName} className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {displayImages.map((img, index) => (
              <div 
                key={index} 
                className={`aspect-square bg-teal-50 rounded-sm overflow-hidden cursor-pointer border-2 transition-all ${index === activeImageIndex ? 'border-teal-900 scale-95 shadow-inner' : 'border-transparent opacity-70 hover:opacity-100'}`}
                onClick={() => setActiveImageIndex(index)}
              >
                <img src={img} alt={`${displayName} view ${index + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div>
            <span className="text-teal-700 font-bold text-xs uppercase tracking-widest mb-2 block">
              {product.category === 'Chủng tầm trung' ? t('category.midRange') : product.category === 'Chủng tầm cao' ? t('category.highEnd') : product.category}
            </span>
            <div className="flex justify-between items-start gap-4">
              <h1 className="text-4xl font-serif text-teal-900 mb-2 tracking-tight drop-shadow-sm flex-1">{displayName}</h1>
              <button 
                onClick={toggleWishlist}
                disabled={isWishlistLoading}
                className={`p-3 rounded-full border transition-all ${isInWishlist ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-teal-100 text-slate-400 hover:text-red-500 hover:border-red-200'} active:scale-95`}
                title={isInWishlist ? "Xóa khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
              >
                <Heart className={`w-6 h-6 ${isInWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>
            <p className="text-2xl font-bold text-teal-900">
              {product.amount === 0 ? t('prod.outOfStock') : `${product.price.toLocaleString()} VND`}
            </p>
          </div>

          <p className="text-slate-600 leading-relaxed">
            {displayDescription}
          </p>

          <div className="space-y-4 py-6 border-y border-teal-100">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">{t('prod.category')}</span>
              <span className="text-teal-900 font-bold">
                {product.category === 'Chủng tầm trung' ? t('category.midRange') : product.category === 'Chủng tầm cao' ? t('category.highEnd') : product.category}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">{t('prod.collection')}</span>
              <span className="text-teal-900 font-bold">
                {language === 'en' && product.collection_en ? product.collection_en : product.collection}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className={`flex items-center border border-teal-100 rounded-sm ${product.amount === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={product.amount === 0}
                  className="px-4 py-2 hover:bg-teal-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">remove</span>
                </button>
                <span className="w-12 text-center font-bold text-teal-900">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={product.amount === 0}
                  className="px-4 py-2 hover:bg-teal-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
              <button 
                onClick={() => addToCart(product)}
                disabled={product.amount === 0}
                className="flex-1 bg-teal-900 text-white font-bold py-3 hover:bg-teal-800 transition-all rounded-sm flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-xl">shopping_bag</span>
                {t('prod.addCart')}
              </button>
            </div>
            <button 
              onClick={() => {
                if (product.amount === 0) return;
                for (let i = 0; i < quantity; i++) addToCart(product);
                setView('cart');
              }}
              disabled={product.amount === 0}
              className="w-full border border-teal-900 text-teal-900 font-bold py-3 hover:bg-teal-900 transition-all rounded-sm disabled:border-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed group">
              <span className="group-hover:text-white transition-colors">{t('prod.buyNow')}</span>
            </button>
          </div>

          <div className="flex items-center gap-6 text-xs font-bold text-slate-500 mt-4">
            <div className="flex items-center gap-1 group">
              <span className="material-symbols-outlined text-sm text-teal-700 group-hover:scale-110 transition-transform">local_shipping</span>
              {t('prod.shipping.free')}
            </div>
            <div className="flex items-center gap-1 group">
              <span className="material-symbols-outlined text-sm text-teal-700 group-hover:scale-110 transition-transform">verified_user</span>
              {t('prod.guarantee')}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-20">
        <div className="flex gap-8 border-b border-teal-100 mb-8">
          <button 
            className={`pb-4 font-bold transition-colors ${activeTab === 'details' ? 'border-b-2 border-teal-900 text-teal-900' : 'text-slate-400 hover:text-teal-900'}`}
            onClick={() => setActiveTab('details')}
          >
            {t('prod.tab.details')}
          </button>
          <button 
            className={`pb-4 font-bold transition-colors ${activeTab === 'shipping' ? 'border-b-2 border-teal-900 text-teal-900' : 'text-slate-400 hover:text-teal-900'}`}
            onClick={() => setActiveTab('shipping')}
          >
            {t('prod.tab.shipping')}
          </button>
        </div>
        {activeTab === 'details' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="font-bold text-teal-900">{t('prod.details.desc.title')}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {t('prod.details.desc.content1')}<span className="font-bold text-teal-800">{displayName}</span>{t('prod.details.desc.content2')}
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-teal-900">{t('prod.details.care.title')}</h3>
              <ul className="text-slate-600 text-sm space-y-2 list-disc pl-4">
                <li>{t('prod.details.care.1')}</li>
                <li>{t('prod.details.care.2')}</li>
                <li>{t('prod.details.care.3')}</li>
                <li>{t('prod.details.care.4')}</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="font-bold text-teal-900">{t('prod.shipping.policy.title')}</h3>
              <ul className="text-slate-600 text-sm space-y-2 list-disc pl-4">
                <li>{t('prod.shipping.policy.1')}</li>
                <li>{t('prod.shipping.policy.2')}</li>
                <li>{t('prod.shipping.policy.3')}</li>
                <li>{t('prod.shipping.policy.4')}</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-teal-900">{t('prod.return.policy.title')}</h3>
              <ul className="text-slate-600 text-sm space-y-2 list-disc pl-4">
                <li>{t('prod.return.policy.1')}</li>
                <li>{t('prod.return.policy.2')}</li>
                <li>{t('prod.return.policy.3')}</li>
                <li>{t('prod.return.policy.4')}</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Related Products */}
      <section>
        <h2 className="text-2xl font-bold text-teal-900 mb-8">{t('prod.related')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {relatedProducts.map(p => (
            <ProductCard key={p.id} product={p} onClick={handleRelatedClick} />
          ))}
        </div>
      </section>
    </div>
  );
};
