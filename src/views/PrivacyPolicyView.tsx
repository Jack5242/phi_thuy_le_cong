import React from 'react';
import { View } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface PrivacyPolicyViewProps {
  setView: (view: View) => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = () => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const sections = isVi
    ? [
        { title: '1. Thông Tin Chúng Tôi Thu Thập', body: 'Chúng tôi thu thập tên, địa chỉ email, số điện thoại, địa chỉ giao hàng và thông tin thanh toán khi bạn đặt hàng hoặc tạo tài khoản. Chúng tôi cũng thu thập dữ liệu truy cập website (địa chỉ IP, trình duyệt) để cải thiện dịch vụ.' },
        { title: '2. Mục Đích Sử Dụng Thông Tin', body: 'Thông tin của bạn được sử dụng để xử lý đơn hàng, giao hàng, liên lạc về đơn hàng, cải thiện dịch vụ và gửi thông tin khuyến mãi nếu bạn đã đồng ý.' },
        { title: '3. Bảo Mật Thông Tin', body: 'Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức phù hợp để bảo vệ thông tin cá nhân của bạn khỏi truy cập trái phép, tiết lộ, thay đổi hoặc phá hủy.' },
        { title: '4. Chia Sẻ Thông Tin Với Bên Thứ Ba', body: 'Chúng tôi không bán hoặc cho thuê thông tin cá nhân của bạn. Chúng tôi chỉ chia sẻ với đối tác vận chuyển và nhà cung cấp dịch vụ cần thiết để hoàn thành đơn hàng của bạn.' },
        { title: '5. Quyền Của Bạn', body: 'Bạn có quyền truy cập, chỉnh sửa, xóa thông tin cá nhân của mình bất cứ lúc nào bằng cách đăng nhập vào tài khoản hoặc liên hệ với chúng tôi.' },
        { title: '6. Cookie', body: 'Chúng tôi sử dụng cookie để cải thiện trải nghiệm duyệt web. Bạn có thể tắt cookie trong cài đặt trình duyệt, tuy nhiên một số tính năng của website có thể bị ảnh hưởng.' },
        { title: '7. Cập Nhật Chính Sách', body: 'Chúng tôi có thể cập nhật chính sách này định kỳ. Mọi thay đổi sẽ được thông báo trên website. Ngày cập nhật gần nhất: 01/01/2025.' },
      ]
    : [
        { title: '1. Information We Collect', body: 'We collect your name, email address, phone number, shipping address, and payment information when you place an order or create an account. We also collect website usage data (IP address, browser) to improve our service.' },
        { title: '2. How We Use Your Information', body: 'Your information is used to process orders, arrange delivery, communicate about orders, improve our services, and send promotional updates if you have opted in.' },
        { title: '3. Data Security', body: 'We implement appropriate technical and organizational security measures to protect your personal information from unauthorized access, disclosure, modification, or destruction.' },
        { title: '4. Sharing With Third Parties', body: 'We do not sell or rent your personal information. We only share it with shipping partners and service providers necessary to fulfill your order.' },
        { title: '5. Your Rights', body: 'You have the right to access, correct, or delete your personal information at any time by logging into your account or contacting us.' },
        { title: '6. Cookies', body: 'We use cookies to improve your browsing experience. You can disable cookies in your browser settings, but some features of the website may be affected.' },
        { title: '7. Policy Updates', body: 'We may update this policy periodically. Any changes will be announced on the website. Last updated: January 1, 2025.' },
      ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24">
      <div className="text-center mb-14">
        <p className="text-sm font-bold tracking-widest uppercase text-teal-600 mb-3">
          {isVi ? 'Chính Sách' : 'Policy'}
        </p>
        <h1 className="text-4xl font-extrabold text-teal-900 mb-4">
          {isVi ? 'Chính Sách Bảo Mật' : 'Privacy Policy'}
        </h1>
        <p className="text-slate-500 max-w-lg mx-auto text-sm">
          {isVi
            ? 'Chúng tôi coi trọng sự riêng tư của bạn và cam kết bảo vệ thông tin cá nhân.'
            : 'We value your privacy and are committed to protecting your personal information.'}
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
