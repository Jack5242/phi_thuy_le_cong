import React from 'react';
import { View } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ReturnPolicyViewProps {
  setView: (view: View) => void;
}

export const ReturnPolicyView: React.FC<ReturnPolicyViewProps> = ({ setView }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const sections = isVi
    ? [
        {
          icon: 'assignment_return',
          title: 'Điều Kiện Đổi Trả',
          items: [
            'Sản phẩm được đổi trả trong vòng 7 ngày kể từ ngày nhận hàng.',
            'Sản phẩm phải còn nguyên vẹn, không có dấu hiệu sử dụng, trầy xước hoặc hư hỏng.',
            'Phải có đầy đủ hộp, giấy tờ chứng nhận và phụ kiện đi kèm.',
            'Không áp dụng với sản phẩm đặt làm theo yêu cầu riêng.',
          ],
        },
        {
          icon: 'error',
          title: 'Trường Hợp Được Đổi Trả',
          items: [
            'Sản phẩm bị lỗi do nhà sản xuất hoặc hư hỏng trong quá trình vận chuyển.',
            'Sản phẩm không đúng với mô tả trên website.',
            'Sản phẩm nhận được không khớp với đơn hàng đã đặt.',
          ],
        },
        {
          icon: 'currency_exchange',
          title: 'Chính Sách Hoàn Tiền',
          items: [
            'Hoàn tiền 100% nếu sản phẩm bị lỗi do chúng tôi.',
            'Thời gian hoàn tiền: 3–7 ngày làm việc sau khi chúng tôi nhận được hàng trả về.',
            'Hoàn tiền qua phương thức thanh toán ban đầu hoặc chuyển khoản ngân hàng.',
          ],
        },
        {
          icon: 'local_shipping',
          title: 'Quy Trình Đổi Trả',
          items: [
            'Liên hệ với chúng tôi qua email hoặc điện thoại để thông báo về việc đổi trả.',
            'Chúng tôi sẽ xác nhận và hướng dẫn bạn gửi hàng về.',
            'Chi phí vận chuyển hoàn hàng sẽ do chúng tôi chịu nếu lỗi từ phía chúng tôi.',
            'Sau khi nhận và kiểm tra hàng, chúng tôi sẽ xử lý đổi trả hoặc hoàn tiền.',
          ],
        },
      ]
    : [
        {
          icon: 'assignment_return',
          title: 'Return Conditions',
          items: [
            'Products may be returned within 7 days of receipt.',
            'Items must be in original condition with no signs of use, scratches, or damage.',
            'Original box, certificate of authenticity, and all accessories must be included.',
            'Custom-made or personalized items are not eligible for return.',
          ],
        },
        {
          icon: 'error',
          title: 'Eligible Reasons for Return',
          items: [
            'Product has a manufacturing defect or was damaged during shipping.',
            'Product does not match the description on the website.',
            'Wrong item received.',
          ],
        },
        {
          icon: 'currency_exchange',
          title: 'Refund Policy',
          items: [
            '100% refund if the product defect is our fault.',
            'Refund timeline: 3–7 business days after we receive the returned item.',
            'Refunds are issued via the original payment method or bank transfer.',
          ],
        },
        {
          icon: 'local_shipping',
          title: 'Return Process',
          items: [
            'Contact us by email or phone to initiate a return.',
            'We will confirm and guide you on how to ship the item back.',
            'Return shipping costs are covered by us if the error is on our side.',
            'After receiving and inspecting the item, we will process the exchange or refund.',
          ],
        },
      ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24">
      <div className="text-center mb-14">
        <p className="text-sm font-bold tracking-widest uppercase text-jade-600 mb-3">
          {isVi ? 'Chính Sách' : 'Policy'}
        </p>
        <h1 className="text-4xl font-extrabold text-jade-900 mb-4">
          {isVi ? 'Chính Sách Đổi Trả' : 'Return Policy'}
        </h1>
        <p className="text-slate-500 max-w-lg mx-auto text-sm">
          {isVi
            ? 'Chúng tôi cam kết mang đến trải nghiệm mua sắm an toàn và hài lòng cho mọi khách hàng.'
            : 'We are committed to providing a safe and satisfying shopping experience for every customer.'}
        </p>
      </div>

      <div className="space-y-8">
        {sections.map(sec => (
          <div key={sec.title} className="bg-white border border-jade-100 rounded-2xl p-7 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-jade-50 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-jade-700">{sec.icon}</span>
              </div>
              <h2 className="font-bold text-jade-900 text-lg">{sec.title}</h2>
            </div>
            <ul className="space-y-3">
              {sec.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600 text-sm leading-relaxed">
                  <span className="material-symbols-outlined text-jade-500 text-base mt-0.5 flex-shrink-0">check_circle</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <p className="text-slate-500 text-sm mb-4">
          {isVi ? 'Có câu hỏi về chính sách đổi trả?' : 'Have questions about our return policy?'}
        </p>
        <button onClick={() => setView('contact')} className="bg-jade-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-jade-800 transition-colors">
          {isVi ? 'Liên Hệ Chúng Tôi' : 'Contact Us'}
        </button>
      </div>
    </div>
  );
};
