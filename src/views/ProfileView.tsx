import React, { useState, useEffect } from 'react';
import { View, User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { validatePhone, validateAddress } from '../utils/validation';
import { Package, Truck, CheckCircle2, Clock, Eye, ChevronRight, X } from 'lucide-react';

interface ProfileViewProps {
  user: User;
  token: string;
  onLogout: () => void;
  setView: (view: View) => void;
  onUpdateUser: (user: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, token, onLogout, setView, onUpdateUser }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'orders'>('overview');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);
  const { t } = useLanguage();
  
  const [profileForm, setProfileForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    address: user.address || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showForgotFlow, setShowForgotFlow] = useState(false);
  const [forgotCode, setForgotCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/users/orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (error) {
        console.error('Failed to fetch orders', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneVal = validatePhone(profileForm.phone);
    if (!phoneVal.isValid) {
      setSaveMessage(phoneVal.message);
      return;
    }

    const addressVal = validateAddress(profileForm.address);
    if (!addressVal.isValid) {
      setSaveMessage(addressVal.message);
      return;
    }

    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });
      
      if (response.ok) {
        const updatedUser = { ...user, ...profileForm };
        onUpdateUser(updatedUser);
        setSaveMessage(t('profile.form.success'));
      } else {
        setSaveMessage(t('profile.form.error'));
      }
    } catch (error) {
      setSaveMessage(t('profile.form.connError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage(t('profile.password.mismatch'));
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/users/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await response.json();
      if (response.ok) {
        setPasswordMessage(t('profile.password.success'));
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMessage(data.error || t('profile.password.error'));
      }
    } catch (error) {
      setPasswordMessage(t('profile.form.connError'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRequestForgotCode = async () => {
    setIsSendingCode(true);
    setPasswordMessage('');
    try {
      const response = await fetch('/api/auth/profile/forgot-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setShowForgotFlow(true);
        setPasswordMessage(t('profile.password.codeSent'));
      } else {
        setPasswordMessage(data.error || t('profile.password.error'));
      }
    } catch (error) {
      setPasswordMessage(t('profile.form.connError'));
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleResetWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage(t('profile.password.mismatch'));
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/auth/profile/reset-password-with-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: forgotCode,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await response.json();
      if (response.ok) {
        setPasswordMessage(t('profile.password.success'));
        setShowForgotFlow(false);
        setForgotCode('');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMessage(data.error || t('profile.password.error'));
      }
    } catch (error) {
      setPasswordMessage(t('profile.form.connError'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

  const getRank = (spent: number): { label: string; color: string } => {
    if (spent >= 1_000_000_000) return { label: 'Băng Chủng', color: 'text-cyan-600' };
    if (spent >= 300_000_000) return { label: 'Nếp Chủng', color: 'text-emerald-600' };
    if (spent >= 50_000_000) return { label: 'Đậu Chủng', color: 'text-amber-600' };
    return { label: 'Ngọc Thô', color: 'text-slate-500' };
  };

  const rank = getRank(totalSpent);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar */}
        <aside className="w-full md:w-64 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-sm transition-colors ${activeTab === 'overview' ? 'bg-jade-900 text-white' : 'text-slate-600 hover:bg-jade-50'}`}
          >
            <span className="material-symbols-outlined text-xl">dashboard</span>
            {t('profile.tab.overview')}
          </button>
          {user.email === 'admin@jade.com' && (
            <button 
              onClick={() => setView('admin')}
              className="w-full flex items-center gap-3 px-4 py-3 text-jade-700 hover:bg-jade-50 font-bold rounded-sm transition-colors"
            >
              <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
              {t('profile.tab.admin')}
            </button>
          )}
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-sm transition-colors ${activeTab === 'profile' ? 'bg-jade-900 text-white' : 'text-slate-600 hover:bg-jade-50'}`}
          >
            <span className="material-symbols-outlined text-xl">person</span>
            {t('profile.tab.profile')}
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-sm transition-colors ${activeTab === 'orders' ? 'bg-jade-900 text-white' : 'text-slate-600 hover:bg-jade-50'}`}
          >
            <span className="material-symbols-outlined text-xl">package_2</span>
            {t('profile.tab.orders')}
          </button>
          <button 
            onClick={() => { onLogout(); setView('home'); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 font-bold rounded-sm transition-colors mt-8"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            {t('profile.logout')}
          </button>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-12">
          {activeTab === 'overview' && (
            <section>
              <h1 className="text-3xl font-extrabold text-jade-900 mb-8">{t('profile.welcome')}{user.name || user.email}</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-jade-50 rounded-sm border border-jade-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('profile.overview.totalOrders')}</p>
                  <p className="text-2xl font-extrabold text-jade-900">{orders.length}</p>
                </div>
                <div className="p-6 bg-jade-50 rounded-sm border border-jade-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('profile.overview.tier')}</p>
                  <p className={`text-2xl font-extrabold ${rank.color}`}>{rank.label}</p>
                </div>
              </div>

              {orders.length > 0 && (
                <div className="bg-white border border-jade-100 rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center px-6 py-4 border-b border-jade-50 bg-white">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-jade-50 flex items-center justify-center">
                        <Package className="w-4 h-4 text-jade-700" />
                      </div>
                      <h3 className="font-bold text-jade-900">{t('profile.overview.latestOrder')}</h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-jade-700 hover:text-jade-900 flex items-center gap-1 group"
                    >
                      {t('profile.overview.viewAll')}
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Left: Basic Info & Status */}
                      <div className="flex-1 space-y-6">
                        <div className="flex flex-wrap gap-8">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('profile.orders.id')}</p>
                            <p className="font-mono text-xs font-bold text-jade-900">#{orders[0].id.substring(0, 8)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('profile.orders.total')}</p>
                            <p className="text-sm font-extrabold text-jade-900">{orders[0].total.toLocaleString('vi-VN')}₫</p>
                          </div>
                        </div>

                        {/* Status Timeline */}
                        <div className="pt-2 pb-2">
                          <div className="relative mt-4">
                            <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-100"></div>
                            {(() => {
                              const s = orders[0].status?.toLowerCase().trim() || '';
                              const isCompletedMap: Record<string, number> = {
                                'pending': 0, 'chờ xử lý': 0, 'đang chờ': 0, 'mới': 0,
                                'confirmed': 1, 'processing': 1, 'đã xác nhận': 1, 'đang xử lý': 1, 'xác nhận': 1,
                                'shipped': 2, 'shipping': 2, 'đang giao': 2, 'đang giao hàng': 2, 'đang vận chuyển': 2, 'delivering': 2,
                                'delivered': 3, 'đã giao': 3, 'đã nhận hàng': 3, 'hoàn thành': 3
                              };
                              const currentStepIdx = isCompletedMap[s] ?? -1;
                              
                              return (
                                <>
                                  <div 
                                    className="absolute top-5 left-0 h-0.5 bg-jade-600 transition-all duration-500 z-10"
                                    style={{ width: currentStepIdx === -1 ? '0%' : `${(currentStepIdx / 3) * 100}%` }}
                                  ></div>
                                  <div className="relative flex justify-between">
                                    {[
                                      { id: 'pending', icon: Clock, labelKey: 'profile.orders.status.pending' },
                                      { id: 'confirmed', icon: CheckCircle2, labelKey: 'profile.orders.status.confirmed' },
                                      { id: 'shipping', icon: Truck, labelKey: 'profile.orders.status.shipping' },
                                      { id: 'delivered', icon: Package, labelKey: 'profile.orders.status.delivered' }
                                    ].map((step, idx) => {
                                      const isCompleted = currentStepIdx >= idx;
                                      const isActive = currentStepIdx === idx;
                                      
                                      return (
                                        <div key={step.id} className="flex flex-col items-center gap-2 relative z-10">
                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border-2 ${
                                            isActive ? 'bg-jade-900 text-white border-jade-900 shadow-lg scale-110' :
                                            isCompleted ? 'bg-jade-100 text-jade-700 border-jade-200' :
                                            'bg-white text-slate-300 border-slate-100'
                                          }`}>
                                            <step.icon className="w-5 h-5" />
                                          </div>
                                          <p className={`text-[10px] font-bold uppercase whitespace-nowrap ${isActive ? 'text-jade-900' : isCompleted ? 'text-jade-700' : 'text-slate-400'}`}>
                                            {t(step.labelKey)}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Right: Items Preview */}
                      <div className="w-full lg:w-48 bg-jade-50 rounded-sm p-4 border border-jade-100">
                        <p className="text-[10px] font-bold text-jade-700 uppercase tracking-widest mb-3">
                          {t('profile.overview.itemsCount')} ({orders[0].items?.length || 0})
                        </p>
                        <div className="flex -space-x-4 overflow-hidden mb-4 p-2">
                          {orders[0].items?.slice(0, 3).map((item: any, i: number) => (
                            <div key={i} className="relative inline-block w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-sm">
                              <img src={item.product_image || item.image} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {(orders[0].items?.length || 0) > 3 && (
                            <div className="relative inline-block w-12 h-12 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm">
                              +{(orders[0].items?.length || 0) - 3}
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedOrderDetails(orders[0]);
                            setIsOrderDetailModalOpen(true);
                          }}
                          className="w-full py-2 bg-white text-[10px] font-bold text-jade-900 border border-jade-200 rounded-sm hover:bg-jade-900 hover:text-white hover:border-jade-900 transition-colors uppercase flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          {t('profile.overview.details')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'profile' && (
            <section>
              <h2 className="text-xl font-bold text-jade-900 mb-6">{t('profile.tab.profile')}</h2>
              <form onSubmit={handleUpdateProfile} className="max-w-2xl space-y-6 bg-white p-8 border border-jade-100 rounded-sm">
                {saveMessage && (
                  <div className={`p-4 text-sm rounded-sm ${saveMessage.includes('thành công') || saveMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {saveMessage}
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('profile.form.email')}</label>
                  <input 
                    type="email" 
                    value={user.email} 
                    disabled 
                    className="w-full px-4 py-3 bg-gray-100 border-none rounded-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('profile.form.name')}</label>
                  <input 
                    type="text" 
                    value={profileForm.name} 
                    onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                    className="w-full px-4 py-3 bg-jade-50 border-none focus:ring-2 focus:ring-jade-900 rounded-sm text-jade-900"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('profile.form.phone')}</label>
                  <input 
                    type="tel" 
                    value={profileForm.phone} 
                    onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-jade-50 border-none focus:ring-2 focus:ring-jade-900 rounded-sm text-jade-900"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('profile.form.address')}</label>
                  <textarea 
                    value={profileForm.address} 
                    onChange={e => setProfileForm({...profileForm, address: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 bg-jade-50 border-none focus:ring-2 focus:ring-jade-900 rounded-sm text-jade-900"
                  ></textarea>
                </div>
                
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-jade-900 text-white px-8 py-3 font-bold hover:opacity-90 transition-all rounded-sm disabled:opacity-50"
                >
                  {isSaving ? t('profile.form.saving') : t('profile.form.save')}
                </button>
              </form>

              {/* Password Management Section */}
              <div className="mt-12 max-w-2xl bg-white p-8 border border-jade-100 rounded-sm">
                <h3 className="text-xl font-bold text-jade-900 mb-6">{t('profile.password.title')}</h3>
                
                {passwordMessage && (
                  <div className={`mb-6 p-4 text-sm rounded-sm ${passwordMessage.includes('thành công') || passwordMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {passwordMessage}
                  </div>
                )}

                {!showForgotFlow ? (
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('profile.password.current')}</label>
                      <input 
                        type="password" 
                        required
                        value={passwordForm.currentPassword} 
                        onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                        className="w-full px-4 py-3 bg-jade-50 border-none focus:ring-2 focus:ring-jade-900 rounded-sm text-jade-900"
                      />
                      <button 
                        type="button"
                        onClick={handleRequestForgotCode}
                        disabled={isSendingCode}
                        className="mt-2 text-xs font-bold text-jade-700 hover:underline disabled:opacity-50"
                      >
                        {isSendingCode ? t('auth.loading') : t('profile.password.forgotBtn')}
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('profile.password.new')}</label>
                      <input 
                        type="password" 
                        required
                        value={passwordForm.newPassword} 
                        onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        className="w-full px-4 py-3 bg-jade-50 border-none focus:ring-2 focus:ring-jade-900 rounded-sm text-jade-900"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('profile.password.confirm')}</label>
                      <input 
                        type="password" 
                        required
                        value={passwordForm.confirmPassword} 
                        onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        className="w-full px-4 py-3 bg-jade-50 border-none focus:ring-2 focus:ring-jade-900 rounded-sm text-jade-900"
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isChangingPassword}
                      className="w-full bg-jade-900 text-white px-8 py-4 font-bold hover:opacity-90 transition-all rounded-sm disabled:opacity-50 text-lg shadow-md mt-4"
                    >
                      {isChangingPassword ? t('auth.loading') : t('profile.password.changeBtn')}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetWithCode} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 font-bold text-jade-800">{t('profile.password.codeLabel')}</label>
                      <input 
                        type="text" 
                        required
                        maxLength={6}
                        value={forgotCode} 
                        onChange={e => setForgotCode(e.target.value)}
                        className="w-full px-4 py-3 bg-jade-50 border-none focus:ring-2 focus:ring-jade-900 rounded-sm text-jade-900 font-mono tracking-[0.5em] text-center text-xl"
                        placeholder="000000"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('profile.password.new')}</label>
                      <input 
                        type="password" 
                        required
                        value={passwordForm.newPassword} 
                        onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        className="w-full px-4 py-3 bg-jade-50 border-none focus:ring-2 focus:ring-jade-900 rounded-sm text-jade-900"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('profile.password.confirm')}</label>
                      <input 
                        type="password" 
                        required
                        value={passwordForm.confirmPassword} 
                        onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        className="w-full px-4 py-3 bg-jade-50 border-none focus:ring-2 focus:ring-jade-900 rounded-sm text-jade-900"
                      />
                    </div>

                    <div className="flex gap-4">
                      <button 
                        type="submit" 
                        disabled={isChangingPassword}
                        className="w-full bg-jade-900 text-white px-8 py-4 font-bold hover:opacity-90 transition-all rounded-sm disabled:opacity-50 text-lg shadow-md"
                      >
                        {isChangingPassword ? t('auth.loading') : t('profile.password.resetBtn')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>
          )}

          {activeTab === 'orders' && (
            <section>
              <h2 className="text-xl font-bold text-jade-900 mb-6">{t('profile.tab.orders')}</h2>
            {loading ? (
              <p className="text-slate-500">{t('profile.orders.loading')}</p>
            ) : orders.length === 0 ? (
              <p className="text-slate-500">{t('profile.orders.empty')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-jade-100">
                      <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('profile.orders.id')}</th>
                      <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('profile.orders.date')}</th>
                      <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('profile.orders.status')}</th>
                      <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('profile.orders.total')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {orders.map(order => (
                      <React.Fragment key={order.id}>
                        <tr className="border-b border-jade-50 hover:bg-jade-50/50 transition-colors">
                          <td className="py-4 font-bold text-jade-900">{order.id}</td>
                          <td className="py-4 text-slate-600">{new Date(order.created_at).toLocaleDateString()}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-sm ${
                              order.status?.toLowerCase() === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                              order.status?.toLowerCase() === 'pending' ? 'bg-amber-100 text-amber-700' :
                              order.status?.toLowerCase() === 'shipped' ? 'bg-blue-100 text-blue-700' :
                              order.status?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {(() => {
                                const s = order.status?.toLowerCase().trim() || '';
                                const statusMap: Record<string, string> = {
                                  'pending': 'profile.orders.status.pending',
                                  'chờ xử lý': 'profile.orders.status.pending',
                                  'processing': 'profile.orders.status.confirmed',
                                  'đang xử lý': 'profile.orders.status.confirmed',
                                  'shipped': 'profile.orders.status.shipping',
                                  'đang giao': 'profile.orders.status.shipping',
                                  'delivered': 'profile.orders.status.delivered',
                                  'đã giao': 'profile.orders.status.delivered',
                                  'cancelled': 'profile.orders.status.cancelled',
                                  'đã hủy': 'profile.orders.status.cancelled'
                                };
                                return t(statusMap[s] || s);
                              })()}
                            </span>
                          </td>
                          <td className="py-4 font-bold text-jade-900">{order.total.toLocaleString()} VND</td>
                        </tr>
                        {order.notes && (
                          <tr className="border-b border-jade-50 bg-jade-50/20">
                            <td colSpan={4} className="py-2 text-xs text-slate-500">
                              <span className="font-bold">Ghi chú:</span> {order.notes}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </section>
          )}

          {/* Modal Overlay */}
          {isOrderDetailModalOpen && selectedOrderDetails && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-jade-900/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Modal Header */}
                <div className="p-6 border-b border-jade-50 flex items-center justify-between bg-jade-50/30">
                  <div>
                    <h3 className="text-xl font-bold text-jade-900">{t('profile.orderDetail.title')}</h3>
                    <p className="text-xs text-jade-600 font-bold mt-1 uppercase tracking-wider">#{selectedOrderDetails.id}</p>
                  </div>
                  <button 
                    onClick={() => setIsOrderDetailModalOpen(false)}
                    className="p-2 hover:bg-jade-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-jade-900" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {/* Product List */}
                    <div className="space-y-4">
                      {selectedOrderDetails.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-4 bg-gray-50 p-4 rounded-sm border border-gray-100 hover:border-jade-200 transition-colors">
                          <div className="w-20 h-20 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
                            <img 
                              src={item.product_image || item.image || item.product?.image} 
                              alt={item.product?.name || item.name} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <div className="flex-1">
                        <h4 className="font-bold text-jade-900 text-sm">{item.product_name || item.product?.name || item.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">{item.product_category || item.category || item.product?.category}</p>
                        <div className="flex items-center justify-between mt-2">
                              <p className="text-xs font-bold text-slate-400">x{item.quantity}</p>
                              <p className="text-sm font-extrabold text-jade-900">{item.price?.toLocaleString('vi-VN')}₫</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total Summary */}
                    <div className="border-t border-jade-100 pt-6 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">{t('profile.orders.total')}</span>
                        <span className="text-lg font-extrabold text-jade-900">{selectedOrderDetails.total?.toLocaleString('vi-VN')}₫</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-jade-50 bg-gray-50 flex justify-end">
                  <button 
                    onClick={() => setIsOrderDetailModalOpen(false)}
                    className="px-8 py-3 bg-jade-900 text-white text-xs font-bold rounded-sm hover:bg-jade-800 transition-colors uppercase tracking-widest shadow-lg"
                  >
                    {t('profile.orderDetail.close')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
