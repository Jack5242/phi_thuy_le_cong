import React, { useState, useEffect } from 'react';
import { View } from '../types';
import { validatePassword } from '../utils/validation';

interface AdminResetPasswordViewProps {
  setView: (view: View) => void;
}

export const AdminResetPasswordView: React.FC<AdminResetPasswordViewProps> = ({ setView }) => {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
      const res = await fetch('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Lỗi đặt lại mật khẩu quản trị');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex justify-center">
      <div className="w-full max-w-md bg-white border border-gray-200 p-10 shadow-sm rounded-lg">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-playfair text-teal-900">Đặt Lại Mật Khẩu Quản Trị</h2>
          <p className="text-gray-500 mt-2">Nhập mật khẩu mới cho tài khoản quản trị của bạn</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md text-center">{error}</div>}

        {success ? (
          <div className="text-center">
            <div className="mb-6 p-4 bg-green-50 text-green-700 text-sm rounded-md">
              Mật khẩu quản trị đã được thay đổi thành công.
            </div>
            <button 
              onClick={() => {
                window.history.pushState({}, '', '/admin');
                setView('admin');
              }}
              className="w-full bg-teal-800 text-white font-medium py-3 hover:bg-teal-900 transition-all rounded-md"
            >
              Đăng Nhập Quản Trị
            </button>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Mật khẩu mới</label>
              <input 
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                placeholder="••••••••" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!token}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
              <input 
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
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
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-800 hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Lưu Mật Khẩu Mới'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
