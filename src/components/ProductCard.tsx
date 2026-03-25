import React from 'react';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const { language, t } = useLanguage();
  const displayName = language === 'en' && product.name_en ? product.name_en : product.name;
  
  return (
    <div 
      className="group cursor-pointer"
      onClick={() => onClick(product)}
    >
      <div className="relative aspect-square overflow-hidden mb-4 bg-teal-100 rounded-sm">
        <img 
          src={product.image} 
          alt={displayName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.isNew && (
          <span className="absolute top-3 left-3 bg-teal-900 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-sm">
            {t('prod.badge.new')}
          </span>
        )}
        {product.isPremium && (
          <span className="absolute top-3 left-3 bg-amber-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-sm">
            {t('prod.badge.premium')}
          </span>
        )}
      </div>
      <h3 className="font-sans font-bold text-slate-900 group-hover:text-teal-700 transition-colors tracking-tight">{displayName}</h3>
      <p className="text-slate-500 text-sm mb-2">
        {product.category === 'Chủng tầm trung' ? t('category.midRange') : product.category === 'Chủng tầm cao' ? t('category.highEnd') : product.category} - {language === 'en' && product.collection_en ? product.collection_en : product.collection}
      </p>
      <p className="text-teal-900 font-bold">
        {product.amount === 0 ? t('prod.outOfStock') : `${product.price.toLocaleString('vi-VN')} VND`}
      </p>
    </div>
  );
};
