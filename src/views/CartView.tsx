import React, { useState } from 'react';
import { Product, View, User } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface CartViewProps {
  cartItems: { product: Product; quantity: number }[];
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setView: (view: View) => void;
  appliedVoucher: { code: string; discount: number; type: 'percent' | 'fixed' } | null;
  setAppliedVoucher: (voucher: { code: string; discount: number; type: 'percent' | 'fixed' } | null) => void;
  checkoutFormData: { name: string; phone: string; email: string; address: string; notes: string; without_receipt: boolean };
  setCheckoutFormData: (data: { name: string; phone: string; email: string; address: string; notes: string; without_receipt: boolean }) => void;
  user?: User | null;
}

export const CartView: React.FC<CartViewProps> = ({ 
  cartItems, removeFromCart, updateQuantity, setView, 
  appliedVoucher, setAppliedVoucher, checkoutFormData, setCheckoutFormData, user 
}) => {
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherError, setVoucherError] = useState('');
  const { t } = useLanguage();

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  
  let discountAmount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.type === 'percent') {
      discountAmount = subtotal * appliedVoucher.discount;
    } else {
      discountAmount = appliedVoucher.discount;
    }
  }
  
  const total = Math.max(0, subtotal - discountAmount);

  const applyVoucher = async () => {
    setVoucherError('');
    const code = voucherCode.trim().toUpperCase();
    
    if (!code) {
      setVoucherError(t('cart.voucher.empty'));
      return;
    }
    
    try {
      const res = await fetch(`/api/vouchers/${code}`);
      if (res.ok) {
        const voucher = await res.json();
        setAppliedVoucher({ code: voucher.code, discount: voucher.discount, type: voucher.type });
      } else {
        setAppliedVoucher(null);
        setVoucherError(t('cart.voucher.invalid'));
      }
    } catch (err) {
      setVoucherError(t('cart.voucher.error'));
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    setVoucherError('');
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center justify-center py-20 text-center">
        <span className="material-symbols-outlined text-6xl text-jade-100 mb-6">shopping_bag</span>
        <h2 className="text-2xl font-bold text-jade-900 mb-2">{t('cart.empty.title')}</h2>
        <p className="text-slate-500 mb-8">{t('cart.empty.desc')}</p>
        <button 
          onClick={() => setView('collections')}
          className="bg-jade-900 text-white px-8 py-4 font-bold hover:opacity-90 transition-all rounded-sm"
        >
          {t('cart.empty.btn')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      <h1 className="text-3xl font-extrabold text-jade-900 mb-10">{t('cart.title')}</h1>
      
      <form onSubmit={(e) => { e.preventDefault(); setView('checkout'); }} className="flex flex-col lg:flex-row gap-12">
        {/* User Info Form */}
        <div className="flex-1 space-y-6">
          <div className="bg-white p-8 rounded-sm border border-jade-100">
            <h2 className="text-xl font-bold text-jade-900 mb-6">{t('checkout.details.title')}</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-jade-900 mb-2">{t('checkout.details.name')}</label>
                <input 
                  type="text" 
                  required
                  value={checkoutFormData.name}
                  onChange={(e) => setCheckoutFormData({...checkoutFormData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-jade-200 rounded-sm focus:outline-none focus:border-jade-500"
                  placeholder={t('checkout.details.name.placeholder')}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-jade-900 mb-2">{t('checkout.details.phone')}</label>
                  <input 
                    type="tel" 
                    required
                    value={checkoutFormData.phone}
                    onChange={(e) => setCheckoutFormData({...checkoutFormData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-jade-200 rounded-sm focus:outline-none focus:border-jade-500"
                    placeholder={t('checkout.details.phone.placeholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-jade-900 mb-2">{t('checkout.details.email')}</label>
                  <input 
                    type="email" 
                    value={user ? user.email : checkoutFormData.email}
                    onChange={(e) => setCheckoutFormData({...checkoutFormData, email: e.target.value})}
                    disabled={!!user}
                    className={`w-full px-4 py-3 border border-jade-200 rounded-sm focus:outline-none focus:border-jade-500 ${user ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                    placeholder={t('checkout.details.email.placeholder')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-jade-900 mb-2">{t('checkout.details.address')}</label>
                <textarea 
                  required
                  value={checkoutFormData.address}
                  onChange={(e) => setCheckoutFormData({...checkoutFormData, address: e.target.value})}
                  className="w-full px-4 py-3 border border-jade-200 rounded-sm focus:outline-none focus:border-jade-500 min-h-[100px]"
                  placeholder={t('checkout.details.address.placeholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-jade-900 mb-2">{t('checkout.details.notes') || 'Special Instructions'}</label>
                <textarea 
                  value={checkoutFormData.notes}
                  onChange={(e) => setCheckoutFormData({...checkoutFormData, notes: e.target.value})}
                  className="w-full px-4 py-3 border border-jade-200 rounded-sm focus:outline-none focus:border-jade-500 min-h-[80px]"
                  placeholder={t('checkout.details.notes.placeholder') || 'Any special requests for your order?'}
                />
              </div>
              
              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="without_receipt"
                  checked={checkoutFormData.without_receipt}
                  onChange={(e) => setCheckoutFormData({...checkoutFormData, without_receipt: e.target.checked})}
                  className="w-4 h-4 text-jade-600 border-jade-300 rounded focus:ring-jade-500"
                />
                <label htmlFor="without_receipt" className="ml-2 text-sm text-jade-900">
                  {t('checkout.details.without_receipt') || 'Order without physical receipt'}
                </label>
              </div>
            </div>
          </div>
          
          <div className="pt-6">
            <button 
              type="button"
              onClick={() => setView('collections')}
              className="text-jade-900 font-bold flex items-center gap-2 hover:underline"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              {t('cart.continue')}
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="w-full lg:w-[500px]">
          <div className="bg-jade-50 p-8 rounded-sm sticky top-32">
            <h2 className="text-xl font-bold text-jade-900 mb-6">{t('cart.summary.title')}</h2>
            
            {/* Cart Items List */}
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
              {cartItems.map(item => (
                <div key={item.product.id} className="flex gap-4 bg-white p-3 rounded-sm border border-jade-100">
                  <div className="w-16 h-16 bg-jade-50 rounded-sm overflow-hidden flex-shrink-0">
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-sm text-jade-900 line-clamp-1">{item.product.name}</h3>
                        <p className="text-xs text-slate-500">{item.product.category}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <div className="flex items-center border border-jade-100 rounded-sm">
                        <button 
                          type="button"
                          onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                          className="px-1 py-0.5 hover:bg-jade-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[10px]">remove</span>
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-jade-900">{item.quantity}</span>
                        <button 
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="px-1 py-0.5 hover:bg-jade-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[10px]">add</span>
                        </button>
                      </div>
                      <p className="font-bold text-sm text-jade-900">{(item.product.price * item.quantity).toLocaleString()} VND</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Voucher Section */}
            <div className="mb-6 pb-6 border-b border-jade-200">
              <label className="block text-sm font-bold text-jade-900 mb-2">{t('cart.voucher.label')}</label>
              <div className="flex gap-2 mb-2">
                <input 
                  type="text" 
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder={t('cart.voucher.placeholder')} 
                  className="flex-1 px-3 py-2 border border-jade-200 rounded-sm text-sm focus:outline-none focus:border-jade-500"
                  disabled={!!appliedVoucher}
                />
                {!appliedVoucher ? (
                  <button 
                    type="button"
                    onClick={applyVoucher}
                    className="bg-jade-900 text-white px-4 py-2 rounded-sm text-sm font-bold hover:bg-jade-800 transition-colors"
                  >
                    {t('cart.voucher.apply')}
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={removeVoucher}
                    className="bg-red-50 text-red-600 px-4 py-2 rounded-sm text-sm font-bold hover:bg-red-100 transition-colors"
                  >
                    {t('cart.voucher.cancel')}
                  </button>
                )}
              </div>
              {voucherError && <p className="text-red-500 text-xs">{voucherError}</p>}
              {appliedVoucher && <p className="text-jade-600 text-xs font-medium">{t('cart.voucher.success')}</p>}
            </div>

            <div className="space-y-4 mb-6 pb-6 border-b border-jade-200">
              <div className="flex justify-between text-slate-600">
                <span>{t('cart.summary.subtotal')}</span>
                <span className="font-bold text-jade-900">{subtotal.toLocaleString()} VND</span>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between text-jade-600">
                  <span>{t('cart.summary.discount')} ({appliedVoucher.code})</span>
                  <span className="font-bold">- {discountAmount.toLocaleString()} VND</span>
                </div>
              )}
            </div>
            <div className="flex justify-between text-lg font-extrabold text-jade-900 mb-8">
              <span>{t('cart.summary.total')}</span>
              <span>{total.toLocaleString()} VND</span>
            </div>
            <button 
              type="submit"
              className="w-full bg-jade-900 text-white font-bold py-4 hover:opacity-90 transition-all rounded-sm mb-4"
            >
              {t('cart.checkout')}
            </button>
            <div className="flex items-center justify-center gap-4 text-slate-400">
              <span className="material-symbols-outlined text-xl">payments</span>
              <span className="material-symbols-outlined text-xl">shield</span>
              <span className="material-symbols-outlined text-xl">local_shipping</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
