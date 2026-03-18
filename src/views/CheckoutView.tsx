import React, { useState, useEffect } from 'react';
import { View, User } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface CheckoutViewProps {
  setView: (view: View) => void;
  totalAmount: number;
  clearCart: () => void;
  cartItems: { product: any; quantity: number }[];
  user: User | null;
  appliedVoucher?: { id?: string; code: string; discount: number; type: 'percent' | 'fixed' } | null;
  checkoutFormData: { name: string; phone: string; email: string; address: string; notes: string };
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ setView, totalAmount, clearCart, cartItems, user, appliedVoucher, checkoutFormData }) => {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bankInfo, setBankInfo] = useState({ bankName: 'Vietcombank', bankOwner: 'CÔNG TY TNHH THIÊN MỘC', bankNumber: '0123456789', bankQR: '' });
  const { t } = useLanguage();

  useEffect(() => {
    fetch('/api/settings/bank')
      .then(res => res.json())
      .then(data => {
        if (data && data.bankName) {
          setBankInfo({
            bankName: data.bankName || 'Vietcombank',
            bankOwner: data.bankOwner || 'CÔNG TY TNHH THIÊN MỘC',
            bankNumber: data.bankNumber || '0123456789',
            bankQR: data.bankQR || ''
          });
        }
      })
      .catch(err => console.error('Failed to load bank settings', err));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (withoutReceipt = false) => {
    if (!withoutReceipt && !receiptFile) return;
    
    setIsSubmitting(true);
    
    try {
      let receiptBase64 = null;
      if (receiptFile) {
        receiptBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(receiptFile);
        });
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user ? user.email : `guest_${checkoutFormData.email || 'guest@example.com'}`,
          name: checkoutFormData.name,
          phone: checkoutFormData.phone,
          address: checkoutFormData.address,
          notes: checkoutFormData.notes,
          total: totalAmount,
          items: cartItems,
          user_id: user ? user.id : undefined,
          voucher_id: appliedVoucher ? appliedVoucher.id : undefined,
          voucher_code: appliedVoucher ? appliedVoucher.code : undefined,
          receipt: receiptBase64
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      setIsSubmitting(false);
      setIsSuccess(true);
      clearCart();
    } catch (error) {
      console.error('Order submission failed:', error);
      setIsSubmitting(false);
      alert(t('checkout.error'));
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-24 h-24 bg-jade-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-5xl text-jade-600">check_circle</span>
        </div>
        <h1 className="text-3xl font-extrabold text-jade-900 mb-4">{t('checkout.success.title')}</h1>
        <p className="text-slate-600 mb-8 text-lg">
          {t('checkout.success.desc')}
        </p>
        <button 
          onClick={() => setView('home')}
          className="bg-jade-900 text-white px-8 py-4 font-bold hover:opacity-90 transition-all rounded-sm"
        >
          {t('checkout.success.home')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      <div className="flex items-center gap-4 mb-10">
        <button 
          onClick={() => setView('cart')}
          className="text-slate-400 hover:text-jade-900 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-3xl font-extrabold text-jade-900">{t('checkout.title')}</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Bank Info */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-jade-900 mb-4">{t('checkout.bank.title')}</h2>
            <p className="text-slate-600 mb-6">{t('checkout.bank.desc')}</p>
            
            <div className="bg-jade-50 p-6 rounded-sm space-y-4 border border-jade-100">
              <div className="flex justify-between items-center border-b border-jade-200 pb-3">
                <span className="text-slate-500">{t('checkout.bank.name')}</span>
                <span className="font-bold text-jade-900">{bankInfo.bankName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-jade-200 pb-3">
                <span className="text-slate-500">{t('checkout.bank.owner')}</span>
                <span className="font-bold text-jade-900">{bankInfo.bankOwner}</span>
              </div>
              <div className="flex justify-between items-center border-b border-jade-200 pb-3">
                <span className="text-slate-500">{t('checkout.bank.number')}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-jade-900 font-mono text-lg">{bankInfo.bankNumber}</span>
                  <button className="text-jade-600 hover:text-jade-800" title="Copy">
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-jade-200 pb-3">
                <span className="text-slate-500">{t('checkout.bank.amount')}</span>
                <span className="font-bold text-jade-900 text-lg">{totalAmount.toLocaleString()} VND</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">{t('checkout.bank.content')}</span>
                <span className="font-bold text-jade-900">TM {Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-jade-900 mb-4">{t('checkout.qr.title')}</h2>
            <div className="bg-white p-6 rounded-sm border border-jade-100 flex flex-col items-center justify-center">
              <div className="w-48 h-48 bg-slate-100 mb-4 p-2 border-2 border-jade-200 rounded-sm">
                {bankInfo.bankQR ? (
                  <img 
                    src={bankInfo.bankQR} 
                    alt="Bank QR" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ThienMocPayment" 
                    alt="QR Code" 
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <p className="text-sm text-slate-500 text-center">{t('checkout.qr.desc')}</p>
            </div>
          </div>
        </div>

        {/* Upload Receipt */}
        <div>
          <h2 className="text-xl font-bold text-jade-900 mb-4">{t('checkout.upload.title')}</h2>
          <div className="bg-white p-6 rounded-sm border border-jade-100 h-full flex flex-col">
            <p className="text-slate-600 mb-6">{t('checkout.upload.desc')}</p>
            
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-jade-200 rounded-sm p-8 mb-6 bg-slate-50 hover:bg-jade-50 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {receiptFile ? (
                <div className="text-center">
                  <span className="material-symbols-outlined text-4xl text-jade-600 mb-2">image</span>
                  <p className="font-medium text-jade-900 truncate max-w-[200px]">{receiptFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{t('checkout.upload.change')}</p>
                </div>
              ) : (
                <div className="text-center text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-2">upload_file</span>
                  <p className="font-medium">{t('checkout.upload.btn')}</p>
                  <p className="text-xs mt-1">{t('checkout.upload.support')}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleSubmit(false)}
                disabled={!receiptFile || isSubmitting}
                className={`w-full py-4 font-bold rounded-sm transition-all flex items-center justify-center gap-2 ${
                  !receiptFile 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-jade-900 text-white hover:opacity-90'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    {t('checkout.submit.processing')}
                  </>
                ) : (
                  t('checkout.submit.done')
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
