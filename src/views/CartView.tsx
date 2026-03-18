import React, { useState, useEffect } from 'react';
import { Product, View, User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { validatePhone, validateAddress } from '../utils/validation';

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
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    if (isVoucherModalOpen && user) {
      const fetchAvailableVouchers = async () => {
        setIsLoadingVouchers(true);
        try {
          const res = await fetch(`/api/vouchers/available?email=${encodeURIComponent(user.email)}`);
          if (res.ok) {
            const data = await res.json();
            setAvailableVouchers(data);
          }
        } catch (error) {
          console.error('Failed to fetch vouchers:', error);
        } finally {
          setIsLoadingVouchers(false);
        }
      };
      fetchAvailableVouchers();
    }
  }, [isVoucherModalOpen, user]);

  const handleOpenVoucherModal = () => {
    if (!user) {
      if (window.confirm(t('cart.voucher.loginPrompt'))) {
        setView('auth');
      }
      return;
    }
    setIsVoucherModalOpen(true);
  };

  const executeApplyVoucherCode = async (codeToApply: string) => {
    setVoucherError('');
    if (!codeToApply) {
      setVoucherError(t('cart.voucher.empty'));
      return;
    }

    const emailToUse = user ? user.email : checkoutFormData.email;
    if (!emailToUse) {
      setVoucherError(t('cart.voucher.emailRequired'));
      return;
    }
    
    try {
      const res = await fetch(`/api/vouchers/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToApply, email: emailToUse })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setAppliedVoucher({ 
          code: data.voucher.code, 
          discount: data.voucher.discount, 
          type: data.voucher.type 
        });
        setVoucherCode(codeToApply);
      } else {
        setAppliedVoucher(null);
        setVoucherError(data.error || t('cart.voucher.invalid'));
      }
    } catch (err) {
      setAppliedVoucher(null);
      setVoucherError(t('cart.voucher.error'));
    }
  };

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
    const code = voucherCode.trim().toUpperCase();
    await executeApplyVoucherCode(code);
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    setVoucherError('');
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    const phoneVal = validatePhone(checkoutFormData.phone);
    if (!phoneVal.isValid) {
      setCheckoutError(phoneVal.message);
      return;
    }

    const addressVal = validateAddress(checkoutFormData.address);
    if (!addressVal.isValid) {
      setCheckoutError(addressVal.message);
      return;
    }

    setView('checkout');
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
      
      {checkoutError && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-sm text-center font-bold border border-red-100">{checkoutError}</div>}

      <form onSubmit={handleCheckoutSubmit} className="flex flex-col lg:flex-row gap-12">
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
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-jade-900">{t('cart.voucher.label')}</label>
                <button 
                  type="button" 
                  onClick={handleOpenVoucherModal}
                  className="text-sm text-jade-600 hover:text-jade-800 font-medium flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">local_activity</span>
                  {t('cart.voucher.view')}
                </button>
              </div>
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
      {/* Voucher Modal */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-jade-900 flex items-center gap-2">
                <span className="material-symbols-outlined">local_activity</span>
                {t('cart.voucher.modal.title')}
              </h3>
              <button onClick={() => setIsVoucherModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
              {isLoadingVouchers ? (
                <div className="flex justify-center py-8">
                  <span className="material-symbols-outlined animate-spin text-jade-600 text-3xl">progress_activity</span>
                </div>
              ) : availableVouchers.length > 0 ? (
                <div className="space-y-3">
                  {availableVouchers.map(voucher => {
                    const isEligible = voucher.min_user_spending ? false : true; // Could do more complex eligibility here if needed before applying
                    return (
                      <div key={voucher.id} className="bg-white border text-left border-jade-100 rounded-lg p-4 shadow-sm hover:shadow transition-shadow flex justify-between items-center">
                        <div>
                          <div className="font-bold text-jade-900 text-lg mb-1">{voucher.code}</div>
                          <div className="text-sm font-medium text-jade-700 mb-1">
                            {t('cart.voucher.modal.off')} {voucher.type === 'percent' ? `${voucher.discount * 100}%` : `${voucher.discount.toLocaleString()} đ`}
                          </div>
                          {voucher.min_user_spending > 0 && (
                            <div className="text-xs text-slate-500">
                              {t('cart.voucher.modal.min')} {voucher.min_user_spending.toLocaleString()} đ
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => {
                            executeApplyVoucherCode(voucher.code);
                            setIsVoucherModalOpen(false);
                          }}
                          className="bg-jade-100 text-jade-800 hover:bg-jade-200 px-4 py-2 rounded-md font-bold text-sm transition-colors whitespace-nowrap ml-4"
                        >
                          {t('cart.voucher.modal.use')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">sentiment_dissatisfied</span>
                  <p>{t('cart.voucher.modal.empty')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
