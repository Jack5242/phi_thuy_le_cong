import React, { useState, useEffect } from 'react';
import { View, User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import logo from '../assets/logo.svg';

interface NavbarProps {
  currentView: View;
  setView: (view: View) => void;
  cartCount: number;
  isLoggedIn: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  user?: User | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView, cartCount, isLoggedIn, searchQuery, setSearchQuery, setSelectedCategory, user }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categories = [
    { id: '', label: t('col.filter.all') },
    { id: 'Chủng tầm trung', label: t('category.midRange') },
    { id: 'Chủng tầm cao', label: t('category.highEnd') }
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-700 border-b ${isScrolled ? 'opacity-0 pointer-events-none' : 'bg-teal-900 border-white/10 shadow-xl opacity-100'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* First Row: Search, Centered Brand, and Icons */}
        <div className={`flex items-center justify-between transition-all duration-500 border-b border-white/5 ${isScrolled ? 'py-2' : 'py-4'}`}>
          {/* Mobile Menu Button (Left on Mobile) */}
          <div className="flex-1 flex md:hidden justify-start items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-center group min-w-[40px] hover:scale-110 transition-transform duration-300"
            >
              <div className="flex items-center justify-center h-8">
                <span className="material-symbols-outlined text-3xl text-white group-hover:text-teal-200 transition-colors leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                  {isMobileMenuOpen ? 'close' : 'menu'}
                </span>
              </div>
            </button>
            {currentView !== 'admin' && (
              <button
                onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
                className="flex items-center justify-center group min-w-[40px] hover:scale-110 transition-transform duration-300 gap-1"
              >
                <div className="flex items-center justify-center h-8">
                  <span className="material-symbols-outlined text-2xl text-white group-hover:text-teal-200 transition-colors leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">language</span>
                </div>
              </button>
            )}
          </div>

          {/* Search Bar (Left on Desktop) */}
          <div className="flex-1 hidden md:flex justify-start">
            <div className="flex items-center bg-white/10 px-4 py-2 rounded-full border border-white/20 focus-within:bg-white/15 focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/20 transition-all w-64 shadow-inner">
              <span
                className="material-symbols-outlined text-lg text-white/60 cursor-pointer hover:text-white transition-colors"
                onClick={() => setView('collections')}
              >
                search
              </span>
              <input
                className="bg-transparent border-none focus:ring-0 focus:outline-none text-xs w-full placeholder:text-white/50 text-white ml-2 font-medium"
                placeholder={t('nav.search')}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setView('collections');
                  }
                }}
              />
            </div>
          </div>

          {/* Centered Elegant Brand (Icon Removed) */}
          <div
            className="flex flex-col items-center cursor-pointer group px-2 md:px-8"
            onClick={() => setView('home')}
          >
            <div className="flex items-center justify-center gap-1 md:gap-4 md:-translate-x-2 transition-transform duration-500">
              <img
                src={logo}
                alt="Logo"
                style={{ colorScheme: 'only light' }}
                className="h-8 md:h-16 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] group-hover:drop-shadow-[0_4px_8px_rgba(255,255,255,0.2)] group-hover:scale-105 transition-all duration-500"
              />
              <h2
                className="text-2xl md:text-3xl font-playfair italic tracking-widest uppercase leading-none transition-colors duration-300 text-center"
                style={{ background: 'linear-gradient(135deg, #f5c842 0%, #e8a115 35%, #fde68a 60%, #c97b10 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 2px 6px rgba(200,130,20,0.5))' }}
              >
                Ngọc Lê Công
              </h2>
            </div>
            <div className="flex items-center gap-2 md:gap-3 w-full mt-1 md:mt-2">
              <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(245,200,66,0.4), transparent)' }} />
              {/* SLOGAN FONT SIZE: change text-[7px] (mobile) and md:text-[9px] (desktop) below */}
              <p className="text-[7px] md:text-[10px] font-bold uppercase tracking-[0.15em] md:tracking-[0.4em] whitespace-nowrap text-center"
                style={{ background: 'linear-gradient(135deg, #f5c842 0%, #e8a115 35%, #fde68a 60%, #c97b10 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 1px 4px rgba(200,130,20,0.4))' }}>
                Ngọc từ duyên tâm
              </p>
              <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(245,200,66,0.4), transparent)' }} />
            </div>
          </div>

          {/* Action Icons (Right) - Swapped & Realigned */}
          <div className="flex-1 flex justify-end items-center gap-4 md:gap-10">
            {currentView !== 'admin' && (
              <button
                onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
                className="hidden md:flex flex-col items-center justify-center group min-w-[40px] md:min-w-[60px] hover:scale-110 transition-transform duration-300"
              >
                <div className="flex items-center justify-center h-8">
                  <span className="material-symbols-outlined text-2xl md:text-3xl text-white group-hover:text-teal-200 transition-colors leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">language</span>
                </div>
                <span className="hidden md:block text-[10px] font-extrabold uppercase tracking-tighter text-white group-hover:text-teal-200 transition-colors mt-1 leading-none">{language === 'vi' ? 'VI' : 'EN'}</span>
              </button>
            )}
            <button
              onClick={() => setView('cart')}
              className="flex flex-col items-center justify-center group relative min-w-[40px] md:min-w-[60px] hover:scale-110 transition-transform duration-300"
            >
              <div className="relative flex items-center justify-center h-8">
                <span className="material-symbols-outlined text-2xl md:text-3xl text-white group-hover:text-teal-200 transition-colors leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">shopping_bag</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-white text-teal-900 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] border border-teal-900/10">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden md:block text-[10px] font-extrabold uppercase tracking-tighter text-white group-hover:text-teal-200 transition-colors mt-1 leading-none">{t('nav.cart')}</span>
            </button>
            <button
              onClick={() => setView(isLoggedIn ? 'profile' : 'auth')}
              className="flex flex-col items-center justify-center group min-w-[40px] md:min-w-[60px] hover:scale-110 transition-transform duration-300"
            >
              <div className="flex items-center justify-center h-8">
                <span className="material-symbols-outlined text-2xl md:text-3xl text-white group-hover:text-teal-200 transition-colors leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">account_circle</span>
              </div>
              <span className="hidden md:block text-[10px] font-extrabold uppercase tracking-tighter text-white group-hover:text-teal-200 transition-colors mt-1 leading-none max-w-[70px] truncate text-center">
                {isLoggedIn && user?.name ? user.name : t('nav.account')}
              </span>
            </button>
          </div>
        </div>

        {/* Second Row: Navigation Links (Desktop Only) */}
        <nav className="hidden md:flex items-center justify-center h-12">
          <div className="flex items-center gap-12">
            <button
              onClick={() => setView('home')}
              className={`text-[11px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors relative py-1 text-white/80 ${currentView === 'home' ? 'border-b-2 border-white text-white' : ''}`}
            >
              {t('nav.home')}
            </button>
            <button
              onClick={() => setView('about')}
              className={`text-[11px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors py-1 ${currentView === 'about' ? 'border-b-2 border-white text-white' : 'text-white/80'}`}
            >
              {t('nav.about')}
            </button>

            {/* Products Dropdown */}
            <div
              className="relative group"
              onMouseEnter={() => setIsProductDropdownOpen(true)}
              onMouseLeave={() => setIsProductDropdownOpen(false)}
            >
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setView('collections');
                }}
                className={`text-[11px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors relative py-1 flex items-center gap-1 text-white/80 ${currentView === 'collections' ? 'border-b-2 border-white text-white' : ''}`}
              >
                {t('nav.collections')}
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </button>

              {isProductDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-64 bg-teal-900 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] py-4 z-50 backdrop-blur-md">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setView('collections');
                        setIsProductDropdownOpen(false);
                      }}
                      className="w-full text-left px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/10 transition-all"
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setView('blog')}
              className={`text-[11px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors py-1 ${currentView === 'blog' || currentView === 'blog-detail' ? 'border-b-2 border-white text-white' : 'text-white/80'}`}
            >
              Blog
            </button>
            <button
              onClick={() => setView('contact')}
              className={`text-[11px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors py-1 ${currentView === 'contact' ? 'border-b-2 border-white text-white' : 'text-white/80'}`}
            >
              {t('nav.contact')}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-teal-900 border-b border-white/10 shadow-2xl z-50">
          <div className="flex flex-col py-4">
            <div className="px-6 py-4 border-b border-white/10">
              <div className="flex items-center bg-white/10 px-4 py-2 rounded-full border border-white/20">
                <span
                  className="material-symbols-outlined text-lg text-white/60 cursor-pointer hover:text-white transition-colors"
                  onClick={() => {
                    setView('collections');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  search
                </span>
                <input
                  className="bg-transparent border-none focus:ring-0 focus:outline-none text-xs w-full placeholder:text-white/50 text-white ml-2 font-medium"
                  placeholder={t('nav.search')}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setView('collections');
                      setIsMobileMenuOpen(false);
                    }
                  }}
                />
              </div>
            </div>
            <button
              onClick={() => { setView('home'); setIsMobileMenuOpen(false); }}
              className={`text-left px-6 py-4 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-colors ${currentView === 'home' ? 'text-white bg-white/5' : 'text-white/80'}`}
            >
              {t('nav.home')}
            </button>
            <button
              onClick={() => { setView('about'); setIsMobileMenuOpen(false); }}
              className={`text-left px-6 py-4 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white/5 hover:text-white transition-colors ${currentView === 'about' ? 'text-white bg-white/5' : 'text-white/80'}`}
            >
              {t('nav.about')}
            </button>

            <div className="flex flex-col">
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setView('collections');
                  setIsMobileMenuOpen(false);
                }}
                className={`text-left px-6 py-4 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-colors flex items-center justify-between ${currentView === 'collections' ? 'text-white bg-white/5' : 'text-white/80'}`}
              >
                {t('nav.collections')}
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
              <div className="bg-black/20 py-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setView('collections');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-10 py-3 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setView('blog'); setIsMobileMenuOpen(false); }}
              className={`text-left px-6 py-4 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white/5 hover:text-white transition-colors ${currentView === 'blog' || currentView === 'blog-detail' ? 'text-white bg-white/5' : 'text-white/80'}`}
            >
              Blog
            </button>
            <button
              onClick={() => { setView('contact'); setIsMobileMenuOpen(false); }}
              className={`text-left px-6 py-4 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white/5 hover:text-white transition-colors ${currentView === 'contact' ? 'text-white bg-white/5' : 'text-white/80'}`}
            >
              {t('nav.contact')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
