import React from 'react';
import { View } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ContactViewProps {
  setView: (view: View) => void;
}

export const ContactView: React.FC<ContactViewProps> = () => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24">
      <div className="text-center mb-14">
        <p className="text-sm font-bold tracking-widest uppercase text-jade-600 mb-3">
          {isVi ? 'Liên Hệ' : 'Contact'}
        </p>
        <h1 className="text-4xl font-extrabold text-jade-900 mb-4">
          {isVi ? 'Chúng Tôi Luôn Sẵn Sàng Hỗ Trợ' : "We're Here to Help"}
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          {isVi
            ? 'Hãy liên hệ với chúng tôi qua bất kỳ kênh nào bên dưới.'
            : 'Reach out to us through any channel below.'}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {[
          { icon: 'location_on', label: isVi ? 'Địa chỉ' : 'Address', value: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh' },
          { icon: 'phone', label: isVi ? 'Điện thoại' : 'Phone', value: '0901 234 567' },
          { icon: 'mail', label: 'Email', value: 'contact@phithuylecong.vn' },
          { icon: 'schedule', label: isVi ? 'Giờ làm việc' : 'Business Hours', value: isVi ? 'Thứ 2 – Thứ 7: 8:00 – 18:00' : 'Mon – Sat: 8:00 AM – 6:00 PM' },
        ].map(item => (
          <div key={item.label} className="bg-white border border-jade-100 rounded-2xl p-6 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 bg-jade-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-jade-700 text-xl">{item.icon}</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-slate-700 font-medium">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
