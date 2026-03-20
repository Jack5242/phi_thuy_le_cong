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
    title_en: "Lunar New Year Promotion",
    subtitle: "Giảm giá lên đến 20% cho Bộ Sưu Tập Lục Bảo Hoàng Gia",
    subtitle_en: "Up to 20% off Royal Emerald Collection",
    image: "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?q=80&w=1920&auto=format&fit=crop",
    cta: "Mua Ngay",
    cta_en: "Shop Now"
  },
  {
    id: 2,
    title: "Giấc Mơ Sắc Tím",
    title_en: "Purple Passion",
    subtitle: "Sản Phẩm Mới: Phỉ Thúy Tím Chạm Khắc Thủ Công",
    subtitle_en: "New Arrival: Hand-carved Lavender Jadeite",
    image: "https://images.unsplash.com/photo-1588444839799-eb642997a34f?q=80&w=1920&auto=format&fit=crop",
    cta: "Khám Phá",
    cta_en: "Explore"
  },
  {
    id: 3,
    title: "Di Sản Thủ Công",
    title_en: "Craft Heritage",
    subtitle: "Khám phá bí mật của Ngọc Phỉ Thúy Myanmar",
    subtitle_en: "Discover the secrets of Myanmar Jadeite",
    image: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?q=80&w=1920&auto=format&fit=crop",
    cta: "Tìm Hiểu Thêm",
    cta_en: "Learn More"
  }
];

function useDraggableAutoScroll(speed: number) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const isDraggingRef = useRef(false);
  const [isHovered, setIsHovered] = useState(false);

  // Removed auto-scroll useEffect logic as requested

  const onDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDown(true);
    if (!sliderRef.current) return;
    sliderRef.current.style.scrollBehavior = 'auto';
    setStartX('touches' in e ? e.targetTouches[0].clientX : (e as React.MouseEvent).clientX);
    setScrollLeft(sliderRef.current.scrollLeft);
    isDraggingRef.current = false;
  };

  const onDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDown || !sliderRef.current) return;
    const currentX = 'touches' in e ? e.targetTouches[0].clientX : (e as React.MouseEvent).clientX;
    const walk = (currentX - startX) * 2;
    let newScrollLeft = scrollLeft - walk;

    // Infinite wrap-around during manual dragging
    const maxScroll = sliderRef.current.scrollWidth / 2;
    if (newScrollLeft >= maxScroll) {
      newScrollLeft -= maxScroll;
      setStartX(currentX);
      setScrollLeft(newScrollLeft);
    } else if (newScrollLeft <= 0) {
      newScrollLeft += maxScroll;
      setStartX(currentX);
      setScrollLeft(newScrollLeft);
    }

    sliderRef.current.scrollLeft = newScrollLeft;

    if (Math.abs(currentX - startX) > 10) {
      isDraggingRef.current = true;
    }
  };

  const onDragEnd = () => {
    setIsDown(false);
    if (sliderRef.current) {
      sliderRef.current.style.scrollBehavior = 'auto';
    }
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const handlers = {
    onMouseDown: onDragStart,
    onMouseMove: onDragMove,
    onMouseUp: onDragEnd,
    onMouseLeave: (e: React.MouseEvent) => { setIsHovered(false); onDragEnd(); },
    onTouchStart: onDragStart,
    onTouchMove: onDragMove,
    onTouchEnd: onDragEnd,
    onClickCapture,
    onDragStart: (e: React.DragEvent) => e.preventDefault(),
    onMouseEnter: () => setIsHovered(true),
  };

  return { sliderRef, handlers, isDown };
}

export const HomeView: React.FC<HomeViewProps> = ({ setView, setSelectedProduct, products }) => {
  const [promotions, setPromotions] = useState<any[]>(PROMOTIONS_FALLBACK);
  const [currentPromo, setCurrentPromo] = useState(0);
  const [promotionsLoaded, setPromotionsLoaded] = useState(false);
  const [featuredBlogs, setFeaturedBlogs] = useState<any[]>([]);
  const [socialSettings, setSocialSettings] = useState<{ facebook?: string; tiktok?: string; instagram?: string; telegram?: string } | null>(null);
  const { t, language } = useLanguage();

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
      } finally {
        setPromotionsLoaded(true);
      }
    };
    fetchPromotions();
  }, []);

  useEffect(() => {
    const fetchFeaturedBlogs = async () => {
      try {
        const res = await fetch('/api/blogs/featured');
        if (res.ok) {
          const data = await res.json();
          setFeaturedBlogs(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch featured blogs', err);
      }
    };
    fetchFeaturedBlogs();
  }, []);

  useEffect(() => {
    fetch('/api/settings/social')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setSocialSettings(data); })
      .catch(() => {});
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

  const { sliderRef: sliderRef1, handlers: handlers1, isDown: isDown1 } = useDraggableAutoScroll(0.4);
  const { sliderRef: sliderRef2, handlers: handlers2, isDown: isDown2 } = useDraggableAutoScroll(0.4);

  const infiniteArrivals = React.useMemo(() => [...newArrivals, ...newArrivals], [newArrivals]);
  const infiniteBestSellers = React.useMemo(() => [...bestSellers, ...bestSellers], [bestSellers]);

  return (
    <div className="space-y-12 pb-12">
      {/* 0. Promotion Slider - Full Width */}
      {promotionsLoaded ? (
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
                    {language === 'vi' ? promotions[currentPromo]?.title : (promotions[currentPromo]?.title_en || promotions[currentPromo]?.title)}
                  </motion.h2>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/90 text-lg md:text-xl font-medium mb-8 max-w-lg"
                  >
                    {language === 'vi' ? promotions[currentPromo]?.subtitle : (promotions[currentPromo]?.subtitle_en || promotions[currentPromo]?.subtitle)}
                  </motion.p>
                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    onClick={() => setView('collections')}
                    className="bg-white text-jade-900 px-10 py-4 text-sm md:text-base font-bold rounded-sm hover:bg-jade-50 transition-all uppercase tracking-widest shadow-xl"
                  >
                    {language === 'vi' ? promotions[currentPromo]?.cta : (promotions[currentPromo]?.cta_en || promotions[currentPromo]?.cta)}
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
      ) : (
        <section className="relative h-[600px] md:h-[800px] bg-jade-900 overflow-hidden">
          <div className="absolute inset-0 bg-jade-800 animate-pulse">
            <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-start">
              <div className="max-w-2xl space-y-4">
                <div className="h-4 bg-white/20 rounded w-32"></div>
                <div className="h-16 bg-white/20 rounded w-96"></div>
                <div className="h-6 bg-white/20 rounded w-80"></div>
                <div className="h-12 bg-white/20 rounded w-40"></div>
              </div>
            </div>
          </div>
        </section>
      )}

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
        <div className="relative overflow-hidden w-full">
          <div
            ref={sliderRef1}
            {...handlers1}
            className={`flex gap-8 overflow-x-auto hide-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2 py-4 -mx-2 select-none ${isDown1 ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            <div className="flex gap-8 w-max">
              {infiniteArrivals.map((product, idx) => (
                <div
                  key={`${product.id}-${idx}`}
                  className="w-[280px] sm:w-[320px] shrink-0"
                >
                  <ProductCard product={product} onClick={handleProductClick} />
                </div>
              ))}
            </div>
          </div>
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
          <div className="relative overflow-hidden w-full">
            <div
              ref={sliderRef2}
              {...handlers2}
              className={`flex gap-8 overflow-x-auto hide-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2 py-4 -mx-2 select-none ${isDown2 ? 'cursor-grabbing' : 'cursor-grab'}`}
            >
              <div className="flex gap-8 w-max">
                {infiniteBestSellers.map((product, idx) => (
                  <div
                    key={`${product.id}-${idx}`}
                    className="w-[280px] sm:w-[320px] shrink-0"
                  >
                    <ProductCard product={product} onClick={handleProductClick} />
                  </div>
                ))}
              </div>
            </div>
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

      {/* Social Media Section */}
      {socialSettings && (socialSettings.facebook || socialSettings.tiktok || socialSettings.instagram || socialSettings.telegram) && (
        <section className="py-16 bg-jade-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-jade-400 font-bold tracking-[0.3em] text-xs uppercase block mb-4">
              {language === 'vi' ? 'Kết Nối Với Chúng Tôi' : 'Follow Us'}
            </span>
            <h2 className="text-4xl font-black text-white tracking-tight mb-3">
              {language === 'vi' ? 'Mạng Xã Hội' : 'Social Media'}
            </h2>
            <p className="text-white/60 mb-10 text-sm max-w-md mx-auto">
              {language === 'vi'
                ? 'Theo dõi chúng tôi để cập nhật bộ sưu tập mới nhất, tin tức và ưu đãi độc quyền.'
                : 'Follow us for the latest collections, news, and exclusive offers.'}
            </p>
            <div className="flex items-center justify-center gap-10 flex-wrap">
              {socialSettings.facebook && (
                <a
                  href={socialSettings.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-3"
                >
                  <div className="w-24 h-24 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-[#1877F2] group-hover:border-[#1877F2] transition-all duration-300 shadow-lg">
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </div>
                  <span className="text-white/70 text-xs font-bold uppercase tracking-widest group-hover:text-white transition-colors">Facebook</span>
                </a>
              )}
              {socialSettings.instagram && (
                <a
                  href={socialSettings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-3"
                >
                  <div className="w-24 h-24 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-[#833AB4] group-hover:via-[#FD1D1D] group-hover:to-[#F77737] group-hover:border-transparent transition-all duration-300 shadow-lg">
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </div>
                  <span className="text-white/70 text-xs font-bold uppercase tracking-widest group-hover:text-white transition-colors">Instagram</span>
                </a>
              )}
              {socialSettings.tiktok && (
                <a
                  href={socialSettings.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-3"
                >
                  <div className="w-24 h-24 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-black group-hover:border-black transition-all duration-300 shadow-lg">
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                  </div>
                  <span className="text-white/70 text-xs font-bold uppercase tracking-widest group-hover:text-white transition-colors">TikTok</span>
                </a>
              )}
              {socialSettings.telegram && (
                <a
                  href={socialSettings.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-3"
                >
                  <div className="w-24 h-24 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-[#2AABEE] group-hover:border-[#2AABEE] transition-all duration-300 shadow-lg">
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  </div>
                  <span className="text-white/70 text-xs font-bold uppercase tracking-widest group-hover:text-white transition-colors">Telegram</span>
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="bg-jade-50/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-8">
            <span className="text-jade-700 font-bold tracking-[0.3em] text-xs uppercase">{t('home.blog.subtitle')}</span>
            <h2 className="text-4xl font-black text-jade-900 tracking-tight">{t('home.blog.title')}</h2>
          </div>

          {featuredBlogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {featuredBlogs.map((post) => (
                <motion.div
                  key={post.id}
                  whileHover={{ y: -10 }}
                  onClick={() => setView('blog')}
                  className="bg-white rounded-sm overflow-hidden shadow-lg group cursor-pointer"
                >
                  <div className="aspect-video overflow-hidden bg-jade-50">
                    {post.image ? (
                      <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-jade-300">
                        <span className="material-symbols-outlined text-5xl">article</span>
                      </div>
                    )}
                  </div>
                  <div className="p-8 space-y-4">
                    <span className="text-jade-700 text-[10px] font-bold uppercase tracking-widest">
                      {new Date(post.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <h3 className="text-xl font-bold text-jade-900 group-hover:text-jade-700 transition-colors leading-tight">{post.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{post.excerpt}</p>
                    <div className="pt-4 flex items-center gap-2 text-jade-900 font-bold text-xs uppercase tracking-widest group-hover:gap-3 transition-all">
                      {t('home.blog.readMore')} <span className="material-symbols-outlined text-sm">arrow_right_alt</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-slate-400 text-lg">{t('home.blog.empty')}</p>
              <button onClick={() => setView('blog')} className="mt-4 text-jade-700 font-bold hover:text-jade-900 transition-colors">
                {t('home.blog.viewAllLink')}
              </button>
            </div>
          )}

          <div className="text-center mt-10">
            <button
              onClick={() => setView('blog')}
              className="border-2 border-jade-900 text-jade-900 px-8 py-3 font-bold hover:bg-jade-900 hover:text-white transition-all rounded-sm uppercase tracking-widest text-sm"
            >
              {t('home.blog.viewAllBtn')}
            </button>
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
