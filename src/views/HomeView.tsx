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

function useDraggableAutoScroll(speed: number) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const isDraggingRef = useRef(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let animationFrameId: number;
    let autoScrollLeft = sliderRef.current ? sliderRef.current.scrollLeft : 0;

    const playScroll = () => {
      if (!isDown && !isHovered && sliderRef.current) {
        autoScrollLeft += speed;
        
        // Loop seamlessly if duplicated exactly once
        const maxScroll = sliderRef.current.scrollWidth / 2;
        if (autoScrollLeft >= maxScroll) {
          autoScrollLeft -= maxScroll;
        } else if (autoScrollLeft <= 0) {
          autoScrollLeft += maxScroll;
        }

        sliderRef.current.scrollLeft = autoScrollLeft;
      } else if (sliderRef.current) {
        // sync the internal tracker when manually scrolling
        autoScrollLeft = sliderRef.current.scrollLeft; 
      }
      animationFrameId = requestAnimationFrame(playScroll);
    };
    
    animationFrameId = requestAnimationFrame(playScroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isDown, isHovered, speed]);

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
    sliderRef.current.scrollLeft = scrollLeft - walk;
    
    if (Math.abs(currentX - startX) > 10) {
      isDraggingRef.current = true;
    }
  };

  const onDragEnd = () => {
    setIsDown(false);
    if (sliderRef.current) {
        sliderRef.current.style.scrollBehavior = 'auto'; // Stay auto so it doesn't fight RAF
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
