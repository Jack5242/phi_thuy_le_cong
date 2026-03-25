import React, { useState, useEffect } from 'react';
import { Product, View } from '../types';
import { ProductCard } from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';

interface CollectionsViewProps {
  setView: (view: View) => void;
  setSelectedProduct: (product: Product) => void;
  products: Product[];
  searchQuery?: string;
  initialCategory?: string;
  onCategoryChange?: (cat: string) => void;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({ setView, setSelectedProduct, products, searchQuery, initialCategory, onCategoryChange }) => {
  const { t, language } = useLanguage();
  const [dbCollections, setDbCollections] = useState<any[]>([]);
  // Compute absolute min/max from available products
  const priceMin = React.useMemo(() => products.length ? Math.min(...products.map(p => p.price)) : 0, [products]);
  const priceMax = React.useMemo(() => products.length ? Math.max(...products.map(p => p.price)) : 100000, [products]);

  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [sortOrder, setSortOrder] = useState<string>('featured');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);
  const ALL_CAT = 'all';
  const categories = [
    { id: ALL_CAT, label: t('col.filter.all') },
    { id: 'Chủng tầm trung', label: t('category.midRange') },
    { id: 'Chủng tầm cao', label: t('category.highEnd') }
  ];
  const [selectedCategory, setSelectedCategory] = useState(() => initialCategory || ALL_CAT);
  const collections = React.useMemo(() => {
    const fromProducts = Array.from(new Set(products.map(p => p.collection))).filter(Boolean);
    const fromDb = dbCollections.map(c => c.name);
    return Array.from(new Set([...fromDb, ...fromProducts]));
  }, [products, dbCollections]);

  const removeAccents = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };

  // Sync when initialCategory changes (e.g. from nav bar click)
  useEffect(() => {
    if (initialCategory !== undefined) {
      if (initialCategory === '' || initialCategory === 'Tất cả' || initialCategory === 'All') {
        setSelectedCategory(ALL_CAT);
      } else {
        setSelectedCategory(initialCategory);
      }
    }
  }, [initialCategory]);

  useEffect(() => {
    const fetchDbCollections = async () => {
      try {
        const res = await fetch('/api/collections');
        if (res.ok) setDbCollections(await res.json());
      } catch (err) {
        console.error('Failed to fetch collections', err);
      }
    };
    fetchDbCollections();
  }, []);

  // Reset slider bounds when product list changes
  useEffect(() => {
    if (products.length > 0) {
      setMinPrice(priceMin);
      setMaxPrice(priceMax);
    }
  }, [priceMin, priceMax]);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') return;

    const timeoutId = setTimeout(() => {
      fetch('/api/search/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: searchQuery })
      }).catch(err => console.error('Failed to log search:', err));
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  let filteredProducts = [...products];

  if (searchQuery) {
    const searchTerms = removeAccents(searchQuery).split(/\s+/).filter(Boolean);
    filteredProducts = filteredProducts.filter(p => {
      const searchableText = removeAccents(`${p.name} ${p.description} ${p.category} ${p.collection}`);
      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  if (selectedCategory !== ALL_CAT) {
    filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
  }

  if (selectedCollections.length > 0) {
    filteredProducts = filteredProducts.filter(p => selectedCollections.includes(p.collection));
  }

  filteredProducts = filteredProducts.filter(p => p.price >= minPrice && p.price <= maxPrice);

  if (sortOrder === 'price-asc') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortOrder === 'price-desc') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortOrder === 'name-asc') {
    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  }

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setView('detail');
  };

  const handleCollectionChange = (collection: string) => {
    setSelectedCollections(prev =>
      prev.includes(collection) ? prev.filter(c => c !== collection) : [...prev, collection]
    );
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-teal-900 tracking-tight mb-2">{t('col.page.title')}</h1>
        {searchQuery ? (
          <p className="text-slate-500 max-w-2xl text-lg">{t('col.searchResult')} "{searchQuery}"</p>
        ) : (
          <p className="text-slate-500 max-w-2xl text-lg">{t('col.page.desc')}</p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 flex flex-col gap-8">
          <div>
            <h3 className="font-bold text-teal-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-xl">category</span> {t('col.filter.category')}
            </h3>
            <div className="flex flex-col gap-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-sm text-sm transition-colors ${selectedCategory === cat.id ? 'bg-teal-900 text-white font-bold' : 'text-slate-600 hover:bg-teal-50 font-medium'}`}
                >
                  {cat.label}
                  <span className={`text-xs px-2 py-0.5 rounded-sm ${selectedCategory === cat.id ? 'bg-white/20' : 'bg-teal-100'}`}>
                    {cat.id === ALL_CAT ? products.length : products.filter(p => p.category === cat.id).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-teal-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-xl">palette</span> {t('col.filter.collection')}
            </h3>
            <div className="flex flex-wrap lg:flex-col gap-2">
              {collections.map(collection => (
                <label key={collection} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    className="rounded border-slate-300 text-teal-900 focus:ring-teal-900"
                    type="checkbox"
                    checked={selectedCollections.includes(collection)}
                    onChange={() => handleCollectionChange(collection)}
                  />
                  <span className="text-sm font-medium text-slate-700 group-hover:text-teal-900">
                    {(() => {
                      const dbCol = dbCollections.find(c => c.name === collection);
                      if (dbCol) {
                        return language === 'en' && dbCol.name_en ? dbCol.name_en : dbCol.name;
                      }
                      return collection;
                    })()}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-teal-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-xl">payments</span> {t('col.filter.price')}
            </h3>
            <div className="px-2">
              <div className="relative h-1.5 w-full bg-teal-100 rounded-full mb-6 mt-4 flex items-center">
                <div
                  className="absolute h-full bg-teal-700 rounded-full"
                  style={{
                    left: `${((minPrice - priceMin) / (priceMax - priceMin)) * 100}%`,
                    right: `${100 - ((maxPrice - priceMin) / (priceMax - priceMin)) * 100}%`
                  }}
                ></div>
                <input
                  type="range"
                  min={priceMin}
                  max={priceMax}
                  step={Math.max(1, Math.floor((priceMax - priceMin) / 100))}
                  value={minPrice}
                  onChange={(e) => {
                    const value = Math.min(Number(e.target.value), maxPrice - 1);
                    setMinPrice(value);
                    setCurrentPage(1);
                  }}
                  className={`absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-teal-700 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:-mt-1.5 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-teal-700 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:-mt-1.5 ${minPrice > priceMax - (priceMax - priceMin) * 0.05 ? 'z-20' : 'z-10'}`}
                />
                <input
                  type="range"
                  min={priceMin}
                  max={priceMax}
                  step={Math.max(1, Math.floor((priceMax - priceMin) / 100))}
                  value={maxPrice}
                  onChange={(e) => {
                    const value = Math.max(Number(e.target.value), minPrice + 1);
                    setMaxPrice(value);
                    setCurrentPage(1);
                  }}
                  className="absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-teal-700 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:-mt-1.5 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-teal-700 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:-mt-1.5 z-10"
                />
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-500 mt-2">
                <span>{minPrice.toLocaleString('vi-VN')} VND</span>
                <span>{maxPrice.toLocaleString('vi-VN')} VND</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6 border-b border-teal-100 pb-4">
            <span className="text-sm font-medium text-slate-500">
              {t('col.showing')} {filteredProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)}{t('col.of')}{filteredProducts.length}{t('col.items')}
            </span>
            <div className="flex gap-2">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-teal-100 bg-white text-teal-900 rounded-sm focus:ring-teal-900 focus:border-teal-900 outline-none"
              >
                <option value={12}>{t('col.show')} 12</option>
                <option value={24}>{t('col.show')} 24</option>
                <option value={36}>{t('col.show')} 36</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-teal-100 bg-white text-teal-900 rounded-sm focus:ring-teal-900 focus:border-teal-900 outline-none"
              >
                <option value="featured">{t('col.sort.featured')}</option>
                <option value="price-asc">{t('col.sort.priceAsc')}</option>
                <option value="price-desc">{t('col.sort.priceDesc')}</option>
                <option value="name-asc">{t('col.sort.nameAsc')}</option>
              </select>
            </div>
          </div>

          {currentProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentProducts.map(product => (
                <ProductCard key={product.id} product={product} onClick={handleProductClick} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500">
              {t('col.emptyFilter')}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="size-10 flex items-center justify-center border border-teal-100 text-slate-400 hover:bg-teal-50 transition-all rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <div className="flex gap-2">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`size-10 flex items-center justify-center rounded-sm transition-all ${currentPage === idx + 1 ? 'bg-teal-900 text-white font-bold' : 'border border-teal-100 text-slate-600 hover:bg-teal-50'}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="size-10 flex items-center justify-center border border-teal-100 text-slate-400 hover:bg-teal-50 transition-all rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
