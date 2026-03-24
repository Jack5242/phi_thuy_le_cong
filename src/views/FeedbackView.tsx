import React, { useState, useEffect } from 'react';
import { View } from '../types';
import { Star } from 'lucide-react';

interface FeedbackViewProps {
  setView: (view: View) => void;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({ setView }) => {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderIdParam = params.get('orderId');
    if (orderIdParam) {
      setOrderId(orderIdParam);
    } else {
      setError('Mã đơn hàng không hợp lệ.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/orders/${orderId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi gửi đánh giá');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center">
      <div className="w-full max-w-lg bg-white border border-teal-100 p-10 rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-teal-900">Đánh Giá Đơn Hàng</h2>
          {orderId && <p className="text-slate-500 mt-2 font-mono">Mã ĐH: {orderId}</p>}
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-sm text-center">{error}</div>}

        {success ? (
          <div className="text-center py-10">
            <h3 className="text-xl font-bold text-teal-800 mb-4">Cảm ơn bạn!</h3>
            <p className="text-slate-600 mb-8">Đánh giá của bạn đã được ghi nhận. Jade Elegance rất trân trọng những đóng góp của bạn.</p>
            <button 
              onClick={() => {
                window.history.pushState({}, '', '/');
                setView('home');
              }}
              className="bg-teal-900 text-white font-bold py-3 px-8 hover:bg-teal-800 transition-colors rounded-full shadow-md"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex flex-col items-center">
              <label className="text-sm font-bold text-slate-700 mb-4">Chất lượng sản phẩm và dịch vụ</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    disabled={!orderId}
                    className="focus:outline-none transition-transform hover:scale-110"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      size={40}
                      className={`${(hoverRating || rating) >= star ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3 font-medium">
                {rating === 1 && 'Rất tệ'}
                {rating === 2 && 'Tệ'}
                {rating === 3 && 'Bình thường'}
                {rating === 4 && 'Hài lòng'}
                {rating === 5 && 'Rất hài lòng!'}
              </p>
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Góp ý thêm (Không bắt buộc)</label>
              <textarea 
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:ring-2 focus:ring-teal-900 rounded-lg text-slate-800 outline-none resize-none" 
                placeholder="Chia sẻ trải nghiệm của bạn với chúng tôi..." 
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={!orderId}
              />
            </div>

            <button 
              type="submit"
              disabled={loading || !orderId}
              className="w-full bg-teal-900 text-white font-bold py-4 hover:shadow-lg hover:-translate-y-1 transition-all rounded-lg mt-8 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? 'Đang gửi...' : 'Gửi Đánh Giá'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
