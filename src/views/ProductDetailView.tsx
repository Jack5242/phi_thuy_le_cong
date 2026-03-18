import React, { useState } from 'react';
import { Product, View } from '../types';
import { ProductCard } from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';

interface ProductDetailViewProps {
  product: Product;
  addToCart: (product: Product) => void;
  setView: (view: View) => void;
  setSelectedProduct: (product: Product) => void;
  products: Product[];
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({ product, addToCart, setView, setSelectedProduct, products }) => {
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'shipping'>('details');
  const { t } = useLanguage();

  const relatedProducts = products.filter(p => p.id !== product.id).slice(0, 4);

  const displayImages = product.images && product.images.length > 0 ? product.images : [product.image, product.image, product.image, product.image];

  const handleRelatedClick = (p: Product) => {
    setSelectedProduct(p);
    window.scrollTo(0, 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
        <button onClick={() => setView('home')} className="hover:text-jade-900">{t('nav.home')}</button>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <button onClick={() => setView('collections')} className="hover:text-jade-900">{t('col.title')}</button>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-jade-900 font-bold">{product.name}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-12 mb-20">
        {/* Image Gallery */}
        <div className="w-full lg:w-1/2 space-y-4">
          <div className="aspect-[1/1] bg-jade-50 rounded-sm overflow-hidden">
            <img src={displayImages[activeImageIndex]} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {displayImages.map((img, index) => (
              <div 
                key={index} 
                className={`aspect-square bg-jade-50 rounded-sm overflow-hidden cursor-pointer border-2 ${index === activeImageIndex ? 'border-jade-900' : 'border-transparent'}`}
                onClick={() => setActiveImageIndex(index)}
              >
                <img src={img} alt={`${product.name} view ${index + 1}`} className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div>
            <span className="text-jade-700 font-bold text-xs uppercase tracking-widest mb-2 block">{product.category}</span>
            <h1 className="text-4xl font-black text-jade-900 mb-2 tracking-tight drop-shadow-sm">{product.name}</h1>
            <p className="text-2xl font-bold text-jade-900">{product.price.toLocaleString()} VND</p>
          </div>

          <p className="text-slate-600 leading-relaxed">
            {product.description}
          </p>

          <div className="space-y-4 py-6 border-y border-jade-100">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">{t('prod.category')}</span>
              <span className="text-jade-900 font-bold">{product.category}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">{t('prod.collection')}</span>
              <span className="text-jade-900 font-bold">{product.collection}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-jade-100 rounded-sm">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-jade-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">remove</span>
                </button>
                <span className="w-12 text-center font-bold text-jade-900">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-jade-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
              <button 
                onClick={() => addToCart(product)}
                className="flex-1 bg-jade-900 text-white font-bold py-3 hover:opacity-90 transition-all rounded-sm flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">shopping_bag</span>
                {t('prod.addCart')}
              </button>
            </div>
            <button 
              onClick={() => {
                for (let i = 0; i < quantity; i++) addToCart(product);
                setView('cart');
              }}
              className="w-full border border-jade-900 text-jade-900 font-bold py-3 hover:bg-jade-900/5 transition-all rounded-sm">
              {t('prod.buyNow')}
            </button>
          </div>

          <div className="flex items-center gap-6 text-xs font-bold text-slate-500 mt-4">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-jade-700">local_shipping</span>
              {t('prod.shipping.free')}
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-jade-700">verified_user</span>
              {t('prod.guarantee')}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-20">
        <div className="flex gap-8 border-b border-jade-100 mb-8">
          <button 
            className={`pb-4 font-bold transition-colors ${activeTab === 'details' ? 'border-b-2 border-jade-900 text-jade-900' : 'text-slate-400 hover:text-jade-900'}`}
            onClick={() => setActiveTab('details')}
          >
            {t('prod.tab.details')}
          </button>
          <button 
            className={`pb-4 font-bold transition-colors ${activeTab === 'shipping' ? 'border-b-2 border-jade-900 text-jade-900' : 'text-slate-400 hover:text-jade-900'}`}
            onClick={() => setActiveTab('shipping')}
          >
            {t('prod.tab.shipping')}
          </button>
        </div>
        {activeTab === 'details' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="font-bold text-jade-900">{t('prod.details.desc.title')}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {t('prod.details.desc.content1')}{product.name}{t('prod.details.desc.content2')}
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-jade-900">{t('prod.details.care.title')}</h3>
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
              <h3 className="font-bold text-jade-900">{t('prod.shipping.policy.title')}</h3>
              <ul className="text-slate-600 text-sm space-y-2 list-disc pl-4">
                <li>{t('prod.shipping.policy.1')}</li>
                <li>{t('prod.shipping.policy.2')}</li>
                <li>{t('prod.shipping.policy.3')}</li>
                <li>{t('prod.shipping.policy.4')}</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-jade-900">{t('prod.return.policy.title')}</h3>
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
        <h2 className="text-2xl font-bold text-jade-900 mb-8">{t('prod.related')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {relatedProducts.map(p => (
            <ProductCard key={p.id} product={p} onClick={handleRelatedClick} />
          ))}
        </div>
      </section>
    </div>
  );
};
