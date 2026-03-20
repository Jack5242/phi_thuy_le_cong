import React from 'react';
import { View } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AboutViewProps {
  setView: (view: View) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ setView }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24">
      {/* Hero */}
      <div className="text-center mb-16">
        <p className="text-sm font-bold tracking-widest uppercase text-jade-600 mb-3">
          {isVi ? 'Về Chúng Tôi' : 'About Us'}
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-jade-900 tracking-tight mb-6">
          {isVi ? 'Phỉ Thúy Lê Công' : 'Phi Thuy Le Cong'}
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
          {isVi
            ? 'Hơn hai thập kỷ đồng hành cùng những viên ngọc quý từ vùng đất Myanmar huyền bí — nơi mỗi sản phẩm đều là một kiệt tác nghệ thuật.'
            : 'Over two decades alongside precious jadeite gems from the mystical land of Myanmar — where every piece is a true work of art.'}
        </p>
      </div>

      {/* Story */}
      <div className="grid md:grid-cols-2 gap-16 items-center mb-20">
        <div>
          <h2 className="text-2xl font-bold text-jade-900 mb-5">
            {isVi ? 'Hành Trình Của Chúng Tôi' : 'Our Journey'}
          </h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              {isVi
                ? 'Phỉ Thúy Lê Công được thành lập từ niềm đam mê mãnh liệt với ngọc phỉ thúy — loại đá quý được mệnh danh là "Vàng Xanh" của phương Đông. Từ những ngày đầu tiên tìm kiếm viên đá hoàn hảo tại các mỏ ở Myanmar, chúng tôi đã không ngừng nỗ lực để mang đến cho khách hàng những sản phẩm xứng đáng nhất.'
                : 'Phi Thuy Le Cong was founded from a deep passion for jadeite — the gemstone known as the "Green Gold" of the East. From the earliest days of searching for the perfect stone in the mines of Myanmar, we have continually strived to bring customers only the finest products.'}
            </p>
            <p>
              {isVi
                ? 'Mỗi viên ngọc chúng tôi lựa chọn đều trải qua quá trình kiểm định nghiêm ngặt bởi các chuyên gia có kinh nghiệm hàng chục năm. Chúng tôi cam kết chỉ cung cấp ngọc phỉ thúy tự nhiên loại A — không xử lý hóa chất, không tẩm màu.'
                : 'Every jade we select undergoes rigorous evaluation by experts with decades of experience. We are committed to offering only Grade-A natural jadeite — no chemical treatments, no artificial coloring.'}
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-jade-50 to-jade-100 rounded-2xl p-10 flex flex-col gap-6">
          {[
            { num: '20+', label: isVi ? 'Năm kinh nghiệm' : 'Years of experience' },
            { num: '5,000+', label: isVi ? 'Khách hàng hài lòng' : 'Satisfied customers' },
            { num: '100%', label: isVi ? 'Ngọc tự nhiên loại A' : 'Grade-A natural jade' },
          ].map(stat => (
            <div key={stat.num} className="flex items-center gap-5">
              <span className="text-3xl font-extrabold text-jade-800">{stat.num}</span>
              <span className="text-slate-600 font-medium">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div className="mb-20">
        <h2 className="text-2xl font-bold text-jade-900 mb-8 text-center">
          {isVi ? 'Giá Trị Cốt Lõi' : 'Our Core Values'}
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: 'verified',
              title: isVi ? 'Chính Hãng' : 'Authenticity',
              desc: isVi ? 'Tất cả sản phẩm đều được chứng nhận nguồn gốc xuất xứ rõ ràng và kiểm định kỹ lưỡng.' : 'All products are certified with clear provenance and rigorously inspected.',
            },
            {
              icon: 'handshake',
              title: isVi ? 'Tận Tâm' : 'Dedication',
              desc: isVi ? 'Chúng tôi lắng nghe, tư vấn và đồng hành cùng khách hàng trong từng bước chọn lựa.' : 'We listen, advise, and walk alongside each customer in every step of their selection.',
            },
            {
              icon: 'auto_awesome',
              title: isVi ? 'Tinh Xảo' : 'Craftsmanship',
              desc: isVi ? 'Từng sản phẩm được chế tác thủ công bởi các nghệ nhân bậc thầy với đôi bàn tay khéo léo.' : 'Every piece is handcrafted by master artisans with skilled, careful hands.',
            },
          ].map(val => (
            <div key={val.title} className="bg-white border border-jade-100 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <span className="material-symbols-outlined text-4xl text-jade-600 mb-4 block">{val.icon}</span>
              <h3 className="font-bold text-jade-900 mb-2">{val.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{val.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <button
          onClick={() => setView('collections')}
          className="inline-flex items-center gap-2 bg-jade-900 text-white px-8 py-3 rounded-full font-bold hover:bg-jade-800 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">diamond</span>
          {isVi ? 'Khám Phá Bộ Sưu Tập' : 'Explore Collection'}
        </button>
      </div>
    </div>
  );
};
