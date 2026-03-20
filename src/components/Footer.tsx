import React from 'react';
import { View } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  setView: (view: View) => void;
}

export const Footer: React.FC<FooterProps> = ({ setView }) => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  return (
    <footer className="bg-jade-900 pt-16 pb-8 border-t border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 text-white mb-6">
            <h2 className="text-lg font-extrabold tracking-tight uppercase">Phỉ thúy Lê Công</h2>
          </div>
          <p className="text-white/60 text-sm leading-relaxed">
            {t('footer.desc')}
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-white uppercase text-xs tracking-widest">{t('footer.links')}</h4>
          <ul className="space-y-4 text-sm text-white/70">
            <li><button onClick={() => setView('collections')} className="hover:text-white transition-colors">{t('col.filter.all')}</button></li>
            <li><button onClick={() => setView('collections')} className="hover:text-white transition-colors">{t('footer.links.midRange')}</button></li>
            <li><button onClick={() => setView('collections')} className="hover:text-white transition-colors">{t('footer.links.highEnd')}</button></li>
            <li><button onClick={() => setView('blog')} className="hover:text-white transition-colors">{isVi ? 'Blog' : 'Blog'}</button></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-white uppercase text-xs tracking-widest">{t('footer.support')}</h4>
          <ul className="space-y-4 text-sm text-white/70">
            <li><button onClick={() => setView('shopping-guide')} className="hover:text-white transition-colors">{t('footer.support.guide')}</button></li>
            <li><button onClick={() => setView('return-policy')} className="hover:text-white transition-colors">{isVi ? 'Chính Sách Đổi Trả' : 'Return Policy'}</button></li>
            <li><button onClick={() => setView('faq')} className="hover:text-white transition-colors">{t('footer.support.faq')}</button></li>
            <li><button onClick={() => setView('contact')} className="hover:text-white transition-colors">{isVi ? 'Liên Hệ' : 'Contact'}</button></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-white uppercase text-xs tracking-widest">{t('footer.company')}</h4>
          <ul className="space-y-4 text-sm text-white/70">
            <li><button onClick={() => setView('about')} className="hover:text-white transition-colors">{t('nav.about')}</button></li>
            <li><button onClick={() => setView('contact')} className="hover:text-white transition-colors">{t('nav.contact')}</button></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/50">
        <p>{t('footer.rights')}</p>
        <div className="flex gap-8">
          <button onClick={() => setView('privacy-policy')} className="hover:underline hover:text-white/80 transition-colors">{t('footer.privacy')}</button>
          <button onClick={() => setView('terms-of-service')} className="hover:underline hover:text-white/80 transition-colors">{t('footer.terms')}</button>
        </div>
        <div className="flex gap-4">
          <span className="material-symbols-outlined cursor-pointer hover:text-white">public</span>
          <span className="material-symbols-outlined cursor-pointer hover:text-white">share</span>
          <span className="material-symbols-outlined cursor-pointer hover:text-white">stars</span>
        </div>
      </div>
    </footer>
  );
};
