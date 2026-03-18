import React, { useState } from 'react';
import { View, User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { validatePassword } from '../utils/validation';

interface AuthViewProps {
  setView: (view: View) => void;
  onLogin: (user: User, token: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ setView, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const resetForms = () => {
    setError('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
    setVerificationCode('');
    setIsVerifying(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        // Forgot Password Flow
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setSuccessMsg('Đường dẫn khôi phục mật khẩu đã được gửi đến email của bạn.');
      } else if (isLogin) {
        // Login Flow
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        onLogin(data.user, data.token);
        setView('profile');
      } else if (!isVerifying) {
        // Initial Registration Flow - Request Verification Code
        if (password !== confirmPassword) {
          throw new Error(t('auth.error.mismatch'));
        }

        const passVal = validatePassword(password);
        if (!passVal.isValid) {
          throw new Error(passVal.message);
        }

        const res = await fetch('/api/auth/request-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setIsVerifying(true);
        setSuccessMsg('Mã xác nhận đã được gửi đến email của bạn. Vui lòng kiểm tra.');
      } else {
        // Final Registration Flow - Verify Code
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, code: verificationCode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        onLogin(data.user, data.token);
        setView('profile');
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex justify-center">
      <div className="w-full max-w-md bg-white border border-jade-100 p-10 rounded-sm shadow-sm">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-extrabold text-jade-900">
            {isForgotPassword ? 'Khôi Phục Mật Khẩu' : (isLogin ? t('auth.login.title') : (isVerifying ? 'Xác Nhận Email' : t('auth.register.title')))}
          </h2>
          <p className="text-slate-500 mt-2">
            {isForgotPassword ? 'Nhập email để nhận link khôi phục' : (isLogin ? t('auth.login.desc') : (isVerifying ? 'Nhập mã 6 số được gửi tới email của bạn' : t('auth.register.desc')))}
          </p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-sm text-center">{error}</div>}
        {successMsg && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-sm text-center">{successMsg}</div>}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {(!isVerifying || isForgotPassword) && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('auth.email')}</label>
              <input 
                className="w-full px-4 py-3 bg-jade-50 border-none focus:ring-2 focus:ring-jade-900 rounded-sm text-jade-900" 
                placeholder="email@vidu.com" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isVerifying}
              />
            </div>
          )}

          {!isForgotPassword && !isVerifying && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('auth.password')}</label>
                {isLogin && (
                  <button type="button" onClick={() => { setIsForgotPassword(true); resetForms(); }} className="text-xs font-bold text-jade-700 hover:underline">
                    {t('auth.forgot')}
                  </button>
                )}
              </div>
              <input 
                className="w-full px-4 py-3 bg-jade-50 border-none focus:ring-2 focus:ring-jade-900 rounded-sm text-jade-900" 
                placeholder="••••••••" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          {!isLogin && !isForgotPassword && !isVerifying && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('auth.confirmPassword')}</label>
              <input 
                className="w-full px-4 py-3 bg-jade-50 border-none focus:ring-2 focus:ring-jade-900 rounded-sm text-jade-900" 
                placeholder="••••••••" 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          {isVerifying && !isForgotPassword && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mã Xác Nhận (6 Số)</label>
              <input 
                className="w-full px-4 py-3 bg-jade-50 border-none focus:ring-2 focus:ring-jade-900 rounded-sm text-jade-900text-center tracking-[0.5em] font-bold" 
                placeholder="000000" 
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-jade-900 text-white font-bold py-4 hover:opacity-90 transition-all rounded-sm mt-4 disabled:opacity-50"
          >
            {loading ? t('auth.loading') : (isForgotPassword ? 'Gửi Link' : (isLogin ? t('auth.login.btn') : (isVerifying ? 'Xác Nhận Đăng Ký' : 'Gửi Mã Xác Nhận')))}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-jade-50 text-center">
          <p className="text-sm text-slate-500">
            {isForgotPassword ? (
              <button 
                onClick={() => { setIsForgotPassword(false); setIsLogin(true); resetForms(); }}
                className="font-bold text-jade-900 hover:underline"
                type="button"
              >
                Quay lại đăng nhập
              </button>
            ) : (
              <>
                {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
                <button 
                  onClick={() => { 
                    setIsLogin(!isLogin); 
                    setIsForgotPassword(false);
                    resetForms();
                  }}
                  className="ml-2 font-bold text-jade-900 hover:underline"
                  type="button"
                >
                  {isLogin ? t('auth.signup') : t('auth.login.btn')}
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
