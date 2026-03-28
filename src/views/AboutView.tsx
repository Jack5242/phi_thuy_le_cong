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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24 space-y-24">
      {/* Hero */}
      <div className="text-center space-y-6">
        <p className="text-sm font-bold tracking-widest uppercase text-teal-600">
          {isVi ? 'Về Chúng Tôi' : 'About Us'}
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-teal-900 tracking-tight">
          {isVi ? 'Phỉ Thúy Lê Công' : 'Phi Thuy Le Cong'}
        </h1>
        <div className="text-xl md:text-2xl text-teal-800 italic font-playfair max-w-3xl mx-auto leading-relaxed px-4 py-8 border-y border-teal-100">
          "{isVi
            ? 'Ngọc vạn năm kết tinh từ linh khí đất trời – Người gặp Ngọc âu cũng là một chữ Duyên.'
            : 'A thousand years of jade crystallized from the aura of heaven and earth – Meeting jade is a matter of Destiny.'}"
        </div>
        <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed pt-4">
          {isVi
            ? 'Chào mừng Quý khách đến với Phỉ Thúy Tận Xưởng Lê Công! Chúng tôi không chỉ là một cửa hàng bán trang sức, mà là nơi kết nối những tâm hồn đồng điệu, yêu vẻ đẹp thuần khiết và giá trị phong thủy sâu sắc của ngọc phỉ thúy.'
            : 'Welcome to Phi Thuy Factory Direct Le Cong! We are not just a jewelry store, but a place to connect kindred spirits who love the pure beauty and profound feng shui value of jadeite.'}
        </p>
      </div>

      {/* Story */}
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div className="space-y-6 text-slate-600 leading-relaxed text-lg">
          <h2 className="text-3xl md:text-4xl font-bold text-teal-900 mb-6 font-playfair italic leading-tight">
            {isVi ? 'Từ Đam Mê Đến Cam Kết "Giá Trị Thật"' : 'From Passion to the Commitment of "True Value"'}
          </h2>
          <p>
            {isVi
              ? 'Trong thị trường Ngọc Phỉ Thúy hiện nay, người chơi ngọc thường phải đối mặt với hai nỗi lo lớn: Sợ mua phải ngọc giả (ngọc xử lý Type B, C) và Sợ mua hớ (giá bị đẩy lên quá cao qua nhiều khâu trung gian).'
              : 'In today\'s Jadeite market, jade enthusiasts often face two major concerns: the fear of buying fake jade (treated jade Type B, C) and the fear of overpaying (prices inflated through multiple intermediaries).'}
          </p>
          <p>
            {isVi
              ? 'Thấu hiểu những trăn trở đó, Phỉ Thúy Tận Xưởng Lê Công ra đời với một sứ mệnh duy nhất: Trực tiếp đưa những viên ngọc tự nhiên chất lượng nhất từ xưởng chế tác đến tận tay người tiêu dùng.'
              : 'Understanding these concerns, Phi Thuy Factory Direct Le Cong was born with a single mission: To directly bring the highest quality natural jade from the crafting workshop into the hands of consumers.'}
          </p>
          <p>
            {isVi
              ? 'Chúng tôi tự hào là đơn vị "Tận Xưởng" – tự tay tuyển chọn phôi đá, trực tiếp mài dũa, chế tác và phân phối. Bằng việc cắt giảm tối đa các khâu trung gian thương mại, Lê Công mang đến cho Quý khách hàng những sản phẩm ngọc thiên nhiên với mức giá thực tế nhất, sát với giá trị cốt lõi của viên đá nhất.'
              : 'We are proud to be a "Factory Direct" unit – handpicking stone roughs, directly grinding, crafting, and distributing. By eliminating maximum commercial intermediaries, Le Cong brings customers natural jade products at the most realistic prices, closest to the core value of the stone.'}
          </p>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-3xl p-10 flex flex-col gap-6 shadow-inner border border-teal-200/50">
          <h2 className="text-2xl font-bold text-teal-900 border-b border-teal-200 pb-4 mb-2">
            {isVi ? 'Tầm Nhìn & Sứ Mệnh' : 'Vision & Mission'}
          </h2>
          <div className="space-y-4 text-slate-700">
            <p className="italic font-medium">
              {isVi ? 'Người xưa có câu: "Người dưỡng Ngọc ba năm, Ngọc dưỡng Người cả đời".' : 'As the ancients said: "A person nourishes jade for three years, jade nourishes a person for a lifetime".'}
            </p>
            <p>
              {isVi
                ? 'Sứ mệnh của Lê Công là lan tỏa văn hóa đeo ngọc, giúp mọi người hiểu đúng về ngọc và dễ dàng sở hữu cho mình một vật phẩm hộ thân mang lại bình an, tài lộc và vượng khí.'
                : 'Le Cong\'s mission is to spread the culture of wearing jade, helping people correctly understand jade, and easily own an amulet that brings peace, fortune, and prosperity.'}
            </p>
            <p>
              {isVi
                ? 'Dù bạn là một "lão làng" sành sỏi về ngọc, hay chỉ mới bước những bước đầu tiên tìm hiểu về Phỉ Thúy, Lê Công luôn sẵn sàng đồng hành cùng bạn. Hãy để chúng tôi giúp bạn tìm thấy viên ngọc thuộc về riêng mình!'
                : 'Whether you are a seasoned jade connoisseur or just taking your first steps in exploring Jadeite, Le Cong is always ready to accompany you. Let us help you find the jade that truly belongs to you!'}
            </p>
            <p className="font-bold text-teal-800 text-lg pt-4">
              {isVi ? 'Phỉ Thúy Tận Xưởng Lê Công. Chân Thành Trọn Vẹn, Ngọc Sáng Tùy Tâm.' : 'Phi Thuy Factory Direct Le Cong. Completely Sincere, Bright Jade from the Heart.'}
            </p>
          </div>
        </div>
      </div>

      {/* Commitments */}
      <div>
        <div className="text-center mb-12">
          <span className="text-teal-600 font-bold tracking-widest uppercase text-sm">{isVi ? 'Giá Trị Tiên Quyết' : 'Prerequisite Values'}</span>
          <h2 className="text-4xl md:text-5xl font-black text-teal-900 mt-4 mb-2 font-playfair italic drop-shadow-sm">
            {isVi ? '4 Lời Cam Kết Vàng' : '4 Golden Commitments'}
          </h2>
          <p className="text-slate-500 mt-4 max-w-2xl mx-auto">
            {isVi ? 'Để xây dựng lòng tin vững chắc trong lòng hàng vạn khách hàng, chúng tôi luôn kiên định với 4 nguyên tắc hoạt động:' : 'To build solid trust within tens of thousands of customers, we remain steadfast to 4 operational principles:'}
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: 'verified',
              title: isVi ? 'Tuyệt đối Tự Nhiên' : 'Absolutely Natural',
              subtitle: '100% Type A',
              desc: isVi
                ? 'Lê Công nói KHÔNG với ngọc xử lý hóa học, ngọc nhuộm màu hay bơm keo. Mỗi sản phẩm bán ra đều là ngọc thiên nhiên nguyên bản, càng đeo càng sáng bóng, lên nước.'
                : 'Le Cong says NO to chemically treated jade, dyed jade, or polymer-filled jade. Every product sold is original natural jade, becoming brighter and shinier the more you wear it.',
            },
            {
              icon: 'policy',
              title: isVi ? 'Minh Bạch Kiểm Định' : 'Transparent Certification',
              subtitle: 'Liulab, Adlab...',
              desc: isVi
                ? 'Mọi sản phẩm (đặc biệt là hàng giá trị cao) đều đi kèm Giấy chứng nhận kiểm định đá quý từ các trung tâm uy tín. Khách hàng có quyền kiểm tra, soi đèn thoải mái trước khi nhận.'
                : 'All products (especially high-value items) come with Gemstone Certification from reputable centers. Customers have the right to comfortably inspect and shine a light before receiving.',
            },
            {
              icon: 'price_check',
              title: isVi ? 'Giá Tận Xưởng' : 'Factory Direct Price',
              subtitle: isVi ? 'Không qua trung gian' : 'No intermediaries',
              desc: isVi
                ? 'Không chi phí mặt bằng đắt đỏ, không phí trung gian. Bạn đang mua ngọc trực tiếp từ người thợ và xưởng chế tác.'
                : 'No expensive premise costs, no intermediary fees. You are buying jade directly from the craftsman and the crafting workshop.',
            },
            {
              icon: 'handshake',
              title: isVi ? 'Tư Vấn Tận Tâm' : 'Dedicated Consultation',
              subtitle: isVi ? 'Bán hàng bằng chữ Tín' : 'Selling with Trust',
              desc: isVi
                ? 'Chúng tôi không ép khách mua hàng. Lê Công lắng nghe nhu cầu, mệnh lý và ngân sách để tư vấn món đồ phù hợp. "Bán một món hàng, kết giao một người bạn" là phương châm của chúng tôi.'
                : 'We do not pressure customers to buy. Le Cong listens to needs, destiny elements, and budgets to advise the most suitable piece. "Selling an item, making a friend" is our motto.',
            },
          ].map(val => (
            <div key={val.title} className="bg-white border border-teal-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 mb-6 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-3xl">{val.icon}</span>
              </div>
              <h3 className="font-bold text-teal-900 text-xl mb-1">{val.title}</h3>
              <p className="text-teal-600 font-medium text-sm mb-4">{val.subtitle}</p>
              <p className="text-sm text-slate-500 leading-relaxed">{val.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-8">
        <button
          onClick={() => setView('collections')}
          className="inline-flex items-center justify-center gap-3 bg-teal-900 text-white px-10 py-4 rounded-full font-bold hover:bg-teal-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          <span className="tracking-wide uppercase text-sm">{isVi ? 'Khám Phá Bộ Sưu Tập Ngay' : 'Explore The Collection Now'}</span>
        </button>
      </div>
    </div>
  );
};
