import React, { useState, useEffect } from 'react';
import { View } from '../types';
import { validatePassword } from '../utils/validation';

interface ResetPasswordViewProps {
  setView: (view: View) => void;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ setView }) => {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Extract token from URL search params
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Đường dẫn không hợp lệ. Vui lòng kiểm tra lại email.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    const passVal = validatePassword(password);
    if (!passVal.isValid) {
      setError(passVal.message);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Lỗi đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex justify-center">
      <div className="w-full max-w-md bg-white border border-teal-100 p-10 rounded-sm shadow-sm">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-extrabold text-teal-900">Đặt Lại Mật Khẩu</h2>
          <p className="text-slate-500 mt-2">Nhập mật khẩu mới cho tài khoản của bạn</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-sm text-center">{error}</div>}

        {success ? (
          <div className="text-center">
            <div className="mb-6 p-4 bg-green-50 text-green-700 text-sm rounded-sm">
              Mật khẩu của bạn đã được đặt lại thành công.
            </div>
            <button 
              onClick={() => {
                window.history.pushState({}, '', '/auth');
                setView('auth');
              }}
              className="w-full bg-teal-900 text-white font-bold py-4 hover:opacity-90 transition-all rounded-sm"
            >
              Quay lại Đăng Nhập
            </button>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mật khẩu mới</label>
              <input 
                className="w-full px-4 py-3 bg-teal-50 border-none focus:ring-2 focus:ring-teal-900 rounded-sm text-teal-900" 
                placeholder="••••••••" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!token}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Xác nhận mật khẩu</label>
              <input 
                className="w-full px-4 py-3 bg-teal-50 border-none focus:ring-2 focus:ring-teal-900 rounded-sm text-teal-900" 
                placeholder="••••••••" 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={!token}
              />
            </div>

            <button 
              type="submit"
              disabled={loading || !token}
              className="w-full bg-teal-900 text-white font-bold py-4 hover:opacity-90 transition-all rounded-sm mt-4 disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Lưu Mật Khẩu Mới'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
