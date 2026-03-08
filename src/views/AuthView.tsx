import React, { useState } from 'react';
import { View, User } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AuthViewProps {
  setView: (view: View) => void;
  onLogin: (user: User, token: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ setView, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && password !== confirmPassword) {
      setError(t('auth.error.mismatch'));
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLogin(data.user, data.token);
      setView('profile');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex justify-center">
      <div className="w-full max-w-md bg-white border border-jade-100 p-10 rounded-sm shadow-sm">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-extrabold text-jade-900">{isLogin ? t('auth.login.title') : t('auth.register.title')}</h2>
          <p className="text-slate-500 mt-2">{isLogin ? t('auth.login.desc') : t('auth.register.desc')}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-sm text-center">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('auth.email')}</label>
            <input 
              className="w-full px-4 py-3 bg-jade-50 border-none focus:ring-2 focus:ring-jade-900 rounded-sm text-jade-900" 
              placeholder="email@vidu.com" 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('auth.password')}</label>
              {isLogin && <button type="button" className="text-xs font-bold text-jade-700 hover:underline">{t('auth.forgot')}</button>}
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

          {!isLogin && (
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

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-jade-900 text-white font-bold py-4 hover:opacity-90 transition-all rounded-sm mt-4 disabled:opacity-50"
          >
            {loading ? t('auth.loading') : (isLogin ? t('auth.login.btn') : t('auth.register.btn'))}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-jade-50 text-center">
          <p className="text-sm text-slate-500">
            {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
            <button 
              onClick={() => { 
                setIsLogin(!isLogin); 
                setError(''); 
                setConfirmPassword('');
              }}
              className="ml-2 font-bold text-jade-900 hover:underline"
              type="button"
            >
              {isLogin ? t('auth.signup') : t('auth.login.btn')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
