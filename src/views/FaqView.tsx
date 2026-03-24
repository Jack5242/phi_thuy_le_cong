import React, { useState } from 'react';
import { View } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface FaqViewProps {
  setView: (view: View) => void;
}

export const FaqView: React.FC<FaqViewProps> = ({ setView }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = isVi
    ? [
        { q: 'Làm sao tôi biết sản phẩm có phải ngọc thật không?', a: 'Tất cả sản phẩm của chúng tôi đều được kiểm định bởi các chuyên gia ngọc học và đi kèm giấy chứng nhận. Bạn cũng có thể yêu cầu kiểm tra tại cửa hàng.' },
        { q: 'Tôi có thể thanh toán bằng những hình thức nào?', a: 'Chúng tôi hỗ trợ chuyển khoản ngân hàng (có mã QR) và thanh toán tiền mặt khi nhận hàng (COD).' },
        { q: 'Thời gian giao hàng là bao lâu?', a: 'Thường từ 1–3 ngày làm việc với khu vực nội thành TP.HCM, 3–5 ngày với các tỉnh thành khác.' },
        { q: 'Tôi có được kiểm tra hàng trước khi thanh toán không?', a: 'Có. Với đơn hàng COD, bạn hoàn toàn có quyền kiểm tra sản phẩm trước khi thanh toán.' },
        { q: 'Tôi có thể đổi trả sản phẩm không?', a: 'Có, trong vòng 7 ngày nếu sản phẩm còn nguyên vẹn hoặc có lỗi từ phía chúng tôi. Xem thêm tại trang Chính Sách Đổi Trả.' },
        { q: 'Làm sao để đặt hàng số lượng lớn hoặc theo yêu cầu?', a: 'Vui lòng liên hệ trực tiếp với chúng tôi qua trang Liên Hệ hoặc gọi hotline để được tư vấn và báo giá.' },
        { q: 'Tôi cần bảo quản ngọc như thế nào?', a: 'Lau sạch bằng vải mềm sau mỗi lần đeo, tránh hóa chất, nhiệt độ cao và bảo quản trong hộp nhung đi kèm.' },
      ]
    : [
        { q: 'How do I know if the product is genuine teal?', a: 'All our products are evaluated by gemological experts and come with a certificate of authenticity. You can also request an in-store inspection.' },
        { q: 'What payment methods do you accept?', a: 'We support bank transfers (with QR code) and cash on delivery (COD).' },
        { q: 'How long does delivery take?', a: 'Typically 1–3 business days in Ho Chi Minh City and 3–5 days for other provinces.' },
        { q: 'Can I inspect the item before paying?', a: 'Yes. For COD orders, you have the right to inspect the product before making payment.' },
        { q: 'Can I return or exchange a product?', a: 'Yes, within 7 days if the item is in original condition or has a defect from our side. See our Return Policy page for details.' },
        { q: 'How do I place a bulk or custom order?', a: 'Please contact us directly through the Contact page or call our hotline for consultation and pricing.' },
        { q: 'How should I care for my teal?', a: 'Wipe clean with a soft cloth after each use, avoid chemicals and high heat, and store in the accompanying velvet box.' },
      ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24">
      <div className="text-center mb-14">
        <p className="text-sm font-bold tracking-widest uppercase text-teal-600 mb-3">FAQ</p>
        <h1 className="text-4xl font-extrabold text-teal-900 mb-4">
          {isVi ? 'Câu Hỏi Thường Gặp' : 'Frequently Asked Questions'}
        </h1>
        <p className="text-slate-500 max-w-lg mx-auto text-sm">
          {isVi
            ? 'Tìm câu trả lời cho những thắc mắc phổ biến nhất của khách hàng.'
            : 'Find answers to the most common customer questions.'}
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white border border-teal-100 rounded-xl overflow-hidden shadow-sm">
            <button
              className="w-full flex items-center justify-between px-6 py-5 text-left"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <span className="font-bold text-teal-900 pr-4">{faq.q}</span>
              <span className={`material-symbols-outlined text-teal-600 flex-shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>
            {openIndex === i && (
              <div className="px-6 pb-5 text-slate-500 text-sm leading-relaxed border-t border-teal-50 pt-4">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-14 text-center">
        <p className="text-slate-500 text-sm mb-4">
          {isVi ? 'Không tìm thấy câu trả lời bạn cần?' : "Didn't find the answer you need?"}
        </p>
        <button onClick={() => setView('contact')} className="bg-teal-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-teal-800 transition-colors">
          {isVi ? 'Liên Hệ Chúng Tôi' : 'Contact Us'}
        </button>
      </div>
    </div>
  );
};
