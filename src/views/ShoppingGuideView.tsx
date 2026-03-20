import React from 'react';
import { View } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ShoppingGuideViewProps {
  setView: (view: View) => void;
}

export const ShoppingGuideView: React.FC<ShoppingGuideViewProps> = ({ setView }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const steps = isVi
    ? [
        { icon: 'search', title: 'Khám Phá Bộ Sưu Tập', body: 'Duyệt qua các sản phẩm của chúng tôi tại trang Bộ Sưu Tập. Bạn có thể lọc theo loại sản phẩm, dòng sản phẩm và khoảng giá để tìm được món đồ phù hợp.' },
        { icon: 'add_shopping_cart', title: 'Thêm Vào Giỏ Hàng', body: 'Chọn sản phẩm yêu thích và nhấn "Thêm Vào Giỏ". Bạn có thể tiếp tục mua sắm và thêm nhiều sản phẩm khác.' },
        { icon: 'local_offer', title: 'Áp Dụng Mã Giảm Giá', body: 'Nếu bạn có mã voucher, hãy nhập vào ô "Mã Giảm Giá" tại trang giỏ hàng trước khi thanh toán.' },
        { icon: 'payments', title: 'Thanh Toán', body: 'Điền đầy đủ thông tin giao hàng và chọn phương thức thanh toán. Chúng tôi hỗ trợ chuyển khoản ngân hàng và tiền mặt khi nhận hàng (COD).' },
        { icon: 'local_shipping', title: 'Nhận Hàng', body: 'Sau khi xác nhận đơn hàng, chúng tôi sẽ đóng gói và giao hàng trong vòng 1–5 ngày làm việc. Bạn sẽ nhận được thông tin đơn hàng qua email.' },
      ]
    : [
        { icon: 'search', title: 'Explore the Collection', body: 'Browse our products on the Collections page. You can filter by category, product line, and price range to find the perfect piece.' },
        { icon: 'add_shopping_cart', title: 'Add to Cart', body: 'Select your favorite product and click "Add to Cart". You can continue shopping and add more items.' },
        { icon: 'local_offer', title: 'Apply a Voucher', body: 'If you have a voucher code, enter it in the "Discount Code" field on the cart page before checkout.' },
        { icon: 'payments', title: 'Checkout', body: 'Fill in your shipping information and choose a payment method. We support bank transfers and cash on delivery (COD).' },
        { icon: 'local_shipping', title: 'Receive Your Order', body: 'After order confirmation, we\'ll pack and deliver within 1–5 business days. You\'ll receive order details via email.' },
      ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24">
      <div className="text-center mb-14">
        <p className="text-sm font-bold tracking-widest uppercase text-jade-600 mb-3">
          {isVi ? 'Hướng Dẫn' : 'Guide'}
        </p>
        <h1 className="text-4xl font-extrabold text-jade-900 mb-4">
          {isVi ? 'Hướng Dẫn Mua Hàng' : 'Shopping Guide'}
        </h1>
        <p className="text-slate-500 max-w-lg mx-auto">
          {isVi
            ? 'Mua sắm tại Phỉ Thúy Lê Công thật đơn giản. Hãy làm theo các bước dưới đây.'
            : 'Shopping at Phi Thuy Le Cong is simple. Just follow the steps below.'}
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-jade-100" />
        <div className="space-y-10">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-6 items-start relative">
              <div className="w-14 h-14 bg-jade-900 text-white rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                <span className="material-symbols-outlined">{step.icon}</span>
              </div>
              <div className="bg-white border border-jade-100 rounded-xl p-5 flex-1 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-jade-500 uppercase tracking-widest">Step {i + 1}</span>
                </div>
                <h3 className="font-bold text-jade-900 text-lg mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 bg-jade-50 border border-jade-100 rounded-2xl p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-jade-600 mb-3 block">support_agent</span>
        <h3 className="font-bold text-jade-900 text-xl mb-2">
          {isVi ? 'Cần Hỗ Trợ?' : 'Need Help?'}
        </h3>
        <p className="text-slate-500 mb-5 text-sm">
          {isVi ? 'Đội ngũ tư vấn của chúng tôi luôn sẵn sàng giải đáp mọi thắc mắc.' : 'Our team is always ready to answer all your questions.'}
        </p>
        <button onClick={() => setView('contact')} className="bg-jade-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-jade-800 transition-colors">
          {isVi ? 'Liên Hệ Ngay' : 'Contact Us'}
        </button>
      </div>
    </div>
  );
};
