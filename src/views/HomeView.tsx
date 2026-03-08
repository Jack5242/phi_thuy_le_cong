import React, { useState, useEffect, useRef } from 'react';
import { Product, View } from '../types';
import { ProductCard } from '../components/ProductCard';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

interface HomeViewProps {
  setView: (view: View) => void;
  setSelectedProduct: (product: Product) => void;
  products: Product[];
}

const PROMOTIONS_FALLBACK = [
  {
    id: 1,
    title: "Khuyến Mãi Tết Nguyên Đán",
    subtitle: "Giảm giá lên đến 20% cho Bộ Sưu Tập Lục Bảo Hoàng Gia",
    image: "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?q=80&w=1920&auto=format&fit=crop",
    cta: "Mua Ngay"
  },
  {
    id: 2,
    title: "Giấc Mơ Sắc Tím",
    subtitle: "Sản Phẩm Mới: Phỉ Thúy Tím Chạm Khắc Thủ Công",
    image: "https://images.unsplash.com/photo-1588444839799-eb642997a34f?q=80&w=1920&auto=format&fit=crop",
    cta: "Khám Phá"
  },
  {
    id: 3,
    title: "Di Sản Thủ Công",
    subtitle: "Khám phá bí mật của Ngọc Phỉ Thúy Myanmar",
    image: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?q=80&w=1920&auto=format&fit=crop",
    cta: "Tìm Hiểu Thêm"
  }
];

export const HomeView: React.FC<HomeViewProps> = ({ setView, setSelectedProduct, products }) => {
  const [promotions, setPromotions] = useState<any[]>(PROMOTIONS_FALLBACK);
  const [currentPromo, setCurrentPromo] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const res = await fetch('/api/promotions');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setPromotions(data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch promotions', err);
      }
    };
    fetchPromotions();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % promotions.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [promotions.length, currentPromo]);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setView('detail');
  };

  const newArrivals = React.useMemo(() => products.filter(p => p.isNew).slice(0, 8), [products]);
  const bestSellers = React.useMemo(() => products.filter(p => p.isBestSeller).slice(0, 8), [products]);

  const [currentIndex, setCurrentIndex] = useState(newArrivals.length * 5);
  const [shiftAmount, setShiftAmount] = useState(0);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateShift = () => {
      if (itemRef.current) {
        setShiftAmount(itemRef.current.offsetWidth + 32); // gap-8 is 32px
      }
    };
    updateShift();
    const timer = setTimeout(updateShift, 100);
    window.addEventListener('resize', updateShift);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateShift);
    };
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => prev - 1);
  };

  const infiniteArrivals = React.useMemo(() => Array(10).fill(newArrivals).flat(), [newArrivals]);

  const [bestSellersIndex, setBestSellersIndex] = useState(bestSellers.length * 5);
  
  const nextBestSellerSlide = () => {
    setBestSellersIndex((prev) => prev + 1);
  };

  const prevBestSellerSlide = () => {
    setBestSellersIndex((prev) => prev - 1);
  };

  const infiniteBestSellers = React.useMemo(() => Array(10).fill(bestSellers).flat(), [bestSellers]);

  return (
    <div className="space-y-12 pb-12">
      {/* 0. Promotion Slider - Full Width */}
      <section className="relative h-[600px] md:h-[800px] bg-jade-900 overflow-hidden group/slider">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPromo}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0"
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-center bg-cover bg-no-repeat scale-105"
              style={{ backgroundImage: `url('${promotions[currentPromo]?.image}')` }}
            >
              <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Content Overlay */}
            <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-start">
              <div className="max-w-2xl">
                <motion.span 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-jade-100 text-sm md:text-base font-bold uppercase tracking-[0.3em] mb-4 block"
                >
                  {t('home.promo.exclusive')}
                </motion.span>
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white text-4xl md:text-7xl font-black tracking-tight mb-4 leading-tight"
                >
                  {promotions[currentPromo]?.title}
                </motion.h2>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90 text-lg md:text-xl font-medium mb-8 max-w-lg"
                >
                  {promotions[currentPromo]?.subtitle}
                </motion.p>
                <motion.button 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={() => setView('collections')}
                  className="bg-white text-jade-900 px-10 py-4 text-sm md:text-base font-bold rounded-sm hover:bg-jade-50 transition-all uppercase tracking-widest shadow-xl"
                >
                  {promotions[currentPromo]?.cta}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation Buttons */}
        <button 
          onClick={() => setCurrentPromo((prev) => (prev - 1 + promotions.length) % promotions.length)}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover/slider:opacity-100"
        >
          <span className="material-symbols-outlined text-2xl">chevron_left</span>
        </button>
        <button 
          onClick={() => setCurrentPromo((prev) => (prev + 1) % promotions.length)}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover/slider:opacity-100"
        >
          <span className="material-symbols-outlined text-2xl">chevron_right</span>
        </button>

        {/* Slider Indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {promotions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPromo(idx)}
              className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentPromo ? 'w-12 bg-white' : 'w-3 bg-white/40'}`}
            />
          ))}
        </div>
      </section>

      {/* 1. New Arrivals (Slider) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-end justify-between mb-8">
          <div className="space-y-2">
            <span className="text-jade-700 font-bold tracking-[0.2em] text-xs uppercase">{t('home.new.subtitle')}</span>
            <h2 className="text-4xl font-black text-jade-900 tracking-tight">{t('home.new.title')}</h2>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('collections')}
              className="text-jade-900 font-bold flex items-center gap-2 hover:gap-3 transition-all group ml-4"
            >
              {t('home.viewAll')} <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
        </div>
        <div className="relative group/slider">
          <button 
            onClick={prevSlide}
            className="absolute -left-6 top-[40%] -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white border border-transparent shadow-lg flex items-center justify-center text-jade-900 hover:bg-jade-50 transition-colors opacity-0 group-hover/slider:opacity-100"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          
          <div className="overflow-hidden px-2 py-4 -mx-2">
            <div 
              className="flex gap-8 transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * shiftAmount}px)` }}
            >
              {infiniteArrivals.map((product, idx) => (
                <div 
                  key={`${product.id}-${idx}`} 
                  ref={idx === 0 ? itemRef : null}
                  className="min-w-[280px] w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)] shrink-0"
                >
                  <ProductCard product={product} onClick={handleProductClick} />
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={nextSlide}
            className="absolute -right-6 top-[40%] -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white border border-transparent shadow-lg flex items-center justify-center text-jade-900 hover:bg-jade-50 transition-colors opacity-0 group-hover/slider:opacity-100"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </section>

      {/* 2. Best Sellers (Slider) */}
      <section className="bg-jade-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div className="space-y-2">
              <span className="text-jade-700 font-bold tracking-[0.2em] text-xs uppercase">{t('home.best.subtitle')}</span>
              <h2 className="text-4xl font-black text-jade-900 tracking-tight">{t('home.best.title')}</h2>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setView('collections')}
                className="text-jade-900 font-bold flex items-center gap-2 hover:gap-3 transition-all group ml-4"
              >
                {t('home.viewAll')} <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          </div>
          <div className="relative group/slider">
            <button 
              onClick={prevBestSellerSlide}
              className="absolute -left-6 top-[40%] -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white border border-transparent shadow-lg flex items-center justify-center text-jade-900 hover:bg-jade-50 transition-colors opacity-0 group-hover/slider:opacity-100"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            
            <div className="overflow-hidden px-2 py-4 -mx-2">
              <div 
                className="flex gap-8 transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${bestSellersIndex * shiftAmount}px)` }}
              >
                {infiniteBestSellers.map((product, idx) => (
                  <div 
                    key={`${product.id}-${idx}`} 
                    className="min-w-[280px] w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)] shrink-0"
                  >
                    <ProductCard product={product} onClick={handleProductClick} />
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={nextBestSellerSlide}
              className="absolute -right-6 top-[40%] -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white border border-transparent shadow-lg flex items-center justify-center text-jade-900 hover:bg-jade-50 transition-colors opacity-0 group-hover/slider:opacity-100"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Our Story */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="w-full lg:w-1/2 relative">
            <div className="aspect-[4/5] rounded-sm overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1000&auto=format&fit=crop" 
                alt="Our Story" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 bg-jade-900 text-white p-8 hidden md:block max-w-xs shadow-2xl">
              <p className="text-sm italic font-serif leading-relaxed">
                "Ngọc phỉ thúy không chỉ là món đồ trang sức, nó là một phần linh hồn của thiên nhiên được gọt giũa bởi bàn tay con người."
              </p>
              <p className="mt-4 font-bold text-xs uppercase tracking-widest">— Lê Công</p>
            </div>
          </div>
          <div className="w-full lg:w-1/2 space-y-8">
            <div className="space-y-4">
              <span className="text-jade-700 font-bold tracking-[0.3em] text-xs uppercase">{t('home.story.subtitle')}</span>
              <h2 className="text-4xl md:text-5xl font-black text-jade-900 leading-tight tracking-tight">
                {t('home.story.title')}
              </h2>
            </div>
            <p className="text-lg text-slate-600 leading-relaxed">
              {t('home.story.p1')}
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              {t('home.story.p2')}
            </p>
            <button 
              onClick={() => setView('collections')}
              className="border-2 border-jade-900 text-jade-900 px-10 py-4 font-black hover:bg-jade-900 hover:text-white transition-all rounded-sm uppercase tracking-widest text-sm"
            >
              {t('home.story.btn')}
            </button>
          </div>
        </div>
      </section>

      {/* 4. Blog Posts */}
      <section className="bg-jade-50/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-8">
            <span className="text-jade-700 font-bold tracking-[0.3em] text-xs uppercase">{t('home.blog.subtitle')}</span>
            <h2 className="text-4xl font-black text-jade-900 tracking-tight">{t('home.blog.title')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: "Cách Phân Biệt Ngọc Phỉ Thúy Thật Giả",
                date: "20 Tháng 2, 2024",
                image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1000&auto=format&fit=crop",
                excerpt: "Những bí quyết từ chuyên gia giúp bạn tự tin hơn khi lựa chọn ngọc quý..."
              },
              {
                title: "Ý Nghĩa Tâm Linh Của Phỉ Thúy Tím",
                date: "15 Tháng 2, 2024",
                image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1000&auto=format&fit=crop",
                excerpt: "Sắc tím huyền bí không chỉ đẹp mà còn mang lại năng lượng chữa lành..."
              },
              {
                title: "Xu Hướng Trang Sức Phỉ Thúy 2024",
                date: "10 Tháng 2, 2024",
                image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1000&auto=format&fit=crop",
                excerpt: "Sự kết hợp hoàn hảo giữa nét cổ điển và thiết kế hiện đại..."
              }
            ].map((post, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -10 }}
                className="bg-white rounded-sm overflow-hidden shadow-lg group cursor-pointer"
              >
                <div className="aspect-video overflow-hidden">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                </div>
                <div className="p-8 space-y-4">
                  <span className="text-jade-700 text-[10px] font-bold uppercase tracking-widest">{post.date}</span>
                  <h3 className="text-xl font-bold text-jade-900 group-hover:text-jade-700 transition-colors leading-tight">{post.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{post.excerpt}</p>
                  <div className="pt-4 flex items-center gap-2 text-jade-900 font-bold text-xs uppercase tracking-widest group-hover:gap-3 transition-all">
                    {t('home.blog.readMore')} <span className="material-symbols-outlined text-sm">arrow_right_alt</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Subscribe */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-jade-900 rounded-sm p-8 md:p-16 text-center relative overflow-hidden">
          {/* Abstract Background Elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-jade-700/20 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <div className="space-y-4">
              <span className="text-jade-200 font-bold tracking-[0.4em] text-xs uppercase">{t('home.sub.subtitle')}</span>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">{t('home.sub.title')}</h2>
              <p className="text-jade-100/70 text-lg">
                {t('home.sub.desc')}
              </p>
            </div>
            <form className="flex flex-col sm:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder={t('home.sub.placeholder')}
                className="flex-1 bg-white/10 border border-white/20 px-6 py-4 text-white placeholder:text-white/40 focus:ring-2 focus:ring-jade-200 focus:border-transparent rounded-sm outline-none transition-all"
              />
              <button className="bg-white text-jade-900 px-10 py-4 font-black uppercase tracking-widest text-sm hover:bg-jade-50 transition-all rounded-sm shadow-xl">
                {t('home.sub.btn')}
              </button>
            </form>
            <p className="text-jade-100/40 text-[10px] uppercase tracking-widest">
              {t('home.sub.note')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
