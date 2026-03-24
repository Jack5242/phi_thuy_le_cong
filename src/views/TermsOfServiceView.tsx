import React from 'react';
import { View } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface TermsOfServiceViewProps {
  setView: (view: View) => void;
}

export const TermsOfServiceView: React.FC<TermsOfServiceViewProps> = () => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const sections = isVi
    ? [
        { title: '1. Chấp Nhận Điều Khoản', body: 'Bằng cách truy cập và sử dụng website Phỉ Thúy Lê Công, bạn đồng ý tuân thủ và bị ràng buộc bởi các Điều Khoản Dịch Vụ này.' },
        { title: '2. Tài Khoản Người Dùng', body: 'Bạn chịu trách nhiệm bảo mật tài khoản và mật khẩu của mình. Không được phép chia sẻ tài khoản hoặc sử dụng tài khoản của người khác.' },
        { title: '3. Sản Phẩm và Giá Cả', body: 'Chúng tôi nỗ lực hiển thị thông tin sản phẩm chính xác nhất. Tuy nhiên, chúng tôi không đảm bảo rằng mô tả sản phẩm, hình ảnh hoặc nội dung khác là hoàn toàn chính xác. Giá có thể thay đổi mà không cần thông báo trước.' },
        { title: '4. Đặt Hàng và Thanh Toán', body: 'Đơn hàng chỉ được xác nhận sau khi chúng tôi xác minh thành công. Chúng tôi có quyền từ chối hoặc hủy đơn hàng trong trường hợp sản phẩm hết hàng hoặc có thông tin không hợp lệ.' },
        { title: '5. Quyền Sở Hữu Trí Tuệ', body: 'Tất cả nội dung trên website, bao gồm hình ảnh, văn bản, logo và thiết kế đều thuộc sở hữu của Phỉ Thúy Lê Công và được bảo vệ bởi luật bản quyền.' },
        { title: '6. Giới Hạn Trách Nhiệm', body: 'Phỉ Thúy Lê Công không chịu trách nhiệm về các thiệt hại gián tiếp, đặc biệt hoặc ngẫu nhiên phát sinh từ việc sử dụng website hoặc sản phẩm.' },
        { title: '7. Luật Áp Dụng', body: 'Các Điều Khoản này được điều chỉnh bởi pháp luật Việt Nam. Mọi tranh chấp sẽ được giải quyết tại tòa án có thẩm quyền tại TP. Hồ Chí Minh.' },
        { title: '8. Thay Đổi Điều Khoản', body: 'Chúng tôi có quyền thay đổi các điều khoản này bất cứ lúc nào. Việc tiếp tục sử dụng website sau khi thay đổi có nghĩa là bạn chấp nhận các điều khoản mới.' },
      ]
    : [
        { title: '1. Acceptance of Terms', body: 'By accessing and using the Phi Thuy Le Cong website, you agree to be bound by these Terms of Service.' },
        { title: '2. User Accounts', body: 'You are responsible for maintaining the security of your account and password. Sharing accounts or using another person\'s account is not permitted.' },
        { title: '3. Products and Pricing', body: 'We strive to display the most accurate product information. However, we do not guarantee that product descriptions, images, or other content are completely accurate. Prices are subject to change without notice.' },
        { title: '4. Ordering and Payment', body: 'An order is only confirmed after successful verification by us. We reserve the right to refuse or cancel orders in cases of out-of-stock items or invalid information.' },
        { title: '5. Intellectual Property', body: 'All content on the website, including images, text, logos, and design, is the property of Phi Thuy Le Cong and protected by copyright law.' },
        { title: '6. Limitation of Liability', body: 'Phi Thuy Le Cong is not liable for any indirect, special, or incidental damages arising from the use of the website or products.' },
        { title: '7. Governing Law', body: 'These Terms are governed by the laws of Vietnam. Any disputes will be resolved in the competent court in Ho Chi Minh City.' },
        { title: '8. Changes to Terms', body: 'We may change these Terms at any time. Continued use of the website after changes constitutes acceptance of the new terms.' },
      ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24">
      <div className="text-center mb-14">
        <p className="text-sm font-bold tracking-widest uppercase text-teal-600 mb-3">
          {isVi ? 'Pháp Lý' : 'Legal'}
        </p>
        <h1 className="text-4xl font-extrabold text-teal-900 mb-4">
          {isVi ? 'Điều Khoản Dịch Vụ' : 'Terms of Service'}
        </h1>
        <p className="text-slate-500 max-w-lg mx-auto text-sm">
          {isVi
            ? 'Vui lòng đọc kỹ các điều khoản trước khi sử dụng dịch vụ của chúng tôi.'
            : 'Please read these terms carefully before using our services.'}
        </p>
      </div>

      <div className="space-y-6">
        {sections.map(sec => (
          <div key={sec.title} className="bg-white border border-teal-100 rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-teal-900 mb-3">{sec.title}</h2>
            <p className="text-slate-500 text-sm leading-relaxed">{sec.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
