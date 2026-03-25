import React, { useState, useEffect } from 'react';
import { View, User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { validatePhone, validateAddress } from '../utils/validation';
import { Package, Truck, CheckCircle2, Clock, Eye, ChevronRight, X, Heart, Ticket } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';

interface ProfileViewProps {
  user: User;
  token: string;
  onLogout: () => void;
  setView: (view: View) => void;
  onUpdateUser: (user: User) => void;
  setSelectedProduct: (product: any) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, token, onLogout, setView, onUpdateUser, setSelectedProduct }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [freshTotalSpent, setFreshTotalSpent] = useState<number>(Number(user.total_spent) || 0);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'orders' | 'wishlist' | 'vouchers'>('overview');
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

    const fetchWishlist = async () => {
      try {
        const response = await fetch('/api/users/wishlist', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setWishlistItems(data);
        }
      } catch (error) {
        console.error('Failed to fetch wishlist', error);
      }
    };

    const fetchVouchers = async () => {
      try {
        const response = await fetch(`/api/vouchers/available?email=${encodeURIComponent(user.email)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setVouchers(data);
        }
      } catch (error) {
        console.error('Failed to fetch vouchers', error);
      }
    };

    const fetchFreshProfile = async () => {
      try {
        const response = await fetch('/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setFreshTotalSpent(Number(data.total_spent) || 0);
          onUpdateUser({ ...user, ...data });
        }
      } catch (error) {
        console.error('Failed to fetch fresh profile', error);
      }
    };

    fetchOrders();
    fetchWishlist();
    fetchVouchers();
    fetchFreshProfile();
  }, [token, user.email]);

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

  const getRank = (spent: number): { label: string; color: string } => {
    if (spent >= 1_000_000_000) return { label: 'Băng Chủng', color: 'text-cyan-600' };
    if (spent >= 300_000_000) return { label: 'Nếp Chủng', color: 'text-emerald-600' };
    if (spent >= 50_000_000) return { label: 'Đậu Chủng', color: 'text-amber-600' };
    return { label: 'Ngọc Thô', color: 'text-slate-500' };
  };

  const rank = getRank(freshTotalSpent);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar */}
        <aside className="w-full md:w-64 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-sm transition-colors ${activeTab === 'overview' ? 'bg-teal-900 text-white' : 'text-slate-600 hover:bg-teal-50'}`}
          >
            <span className="material-symbols-outlined text-xl">dashboard</span>
            {t('profile.tab.overview')}
          </button>
          {user.email === 'admin@teal.com' && (
            <button 
              onClick={() => setView('admin')}
              className="w-full flex items-center gap-3 px-4 py-3 text-teal-700 hover:bg-teal-50 font-bold rounded-sm transition-colors"
            >
              <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
              {t('profile.tab.admin')}
            </button>
          )}
          <button 
            onClick={() => setActiveTab('wishlist')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-sm transition-colors ${activeTab === 'wishlist' ? 'bg-teal-900 text-white' : 'text-slate-600 hover:bg-teal-50'}`}
          >
            <Heart className="w-5 h-5" />
            {t('profile.tab.wishlist')}
          </button>
          <button 
            onClick={() => setActiveTab('vouchers')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-sm transition-colors ${activeTab === 'vouchers' ? 'bg-teal-900 text-white' : 'text-slate-600 hover:bg-teal-50'}`}
          >
            <Ticket className="w-5 h-5" />
            {t('profile.tab.vouchers')}
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-sm transition-colors ${activeTab === 'orders' ? 'bg-teal-900 text-white' : 'text-slate-600 hover:bg-teal-50'}`}
          >
            <span className="material-symbols-outlined text-xl">package_2</span>
            {t('profile.tab.orders')}
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-sm transition-colors ${activeTab === 'profile' ? 'bg-teal-900 text-white' : 'text-slate-600 hover:bg-teal-50'}`}
          >
            <span className="material-symbols-outlined text-xl">person</span>
            {t('profile.tab.profile')}
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
              <h1 className="text-3xl font-extrabold text-teal-900 mb-8 font-sans">{t('profile.welcome')}{user.name || user.email}</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-teal-50 rounded-sm border border-teal-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('profile.overview.totalOrders')}</p>
                  <p className="text-2xl font-extrabold text-teal-900">{orders.length}</p>
                </div>
                <div className="p-6 bg-teal-50 rounded-sm border border-teal-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('profile.overview.tier')}</p>
                  <p className={`text-2xl font-extrabold ${rank.color}`}>{rank.label}</p>
                </div>
              </div>

              {orders.length > 0 && (
                <div className="bg-white border border-teal-100 rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center px-6 py-4 border-b border-teal-50 bg-white">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
                        <Package className="w-4 h-4 text-teal-700" />
                      </div>
                      <h3 className="font-bold text-teal-900 font-sans">{t('profile.overview.latestOrder')}</h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 group"
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
                            <p className="font-mono text-xs font-bold text-teal-900">#{orders[0].id.substring(0, 8)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('profile.orders.total')}</p>
                             <p className="text-sm font-extrabold text-teal-900">{Number(orders[0].total).toLocaleString('vi-VN')}₫</p>
                          </div>
                        </div>

                        {/* Status Timeline */}
                        <div className="pt-2 pb-2">
                          <div className="relative mt-4">
                            <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-100"></div>
                            {(() => {
                              const s = orders[0].status?.toLowerCase().trim() || '';
                              
                              if (s === 'cancelled' || s === 'đã hủy') {
                                return (
                                  <div className="bg-red-50 text-red-700 p-3 rounded-sm border border-red-100 flex items-center justify-center gap-2 relative z-10 w-full mb-4 mt-2">
                                    <X className="w-4 h-4" />
                                    <span className="font-bold text-xs uppercase tracking-widest">{t('profile.orders.status.cancelled', 'Đơn hàng đã bị hủy')}</span>
                                  </div>
                                );
                              }

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
                                    className="absolute top-5 left-0 h-0.5 bg-teal-600 transition-all duration-500 z-10"
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
                                            isActive ? 'bg-teal-900 text-white border-teal-900 shadow-lg scale-110' :
                                            isCompleted ? 'bg-teal-100 text-teal-700 border-teal-200' :
                                            'bg-white text-slate-300 border-slate-100'
                                          }`}>
                                            <step.icon className="w-5 h-5" />
                                          </div>
                                          <p className={`text-[10px] font-bold uppercase whitespace-nowrap ${isActive ? 'text-teal-900' : isCompleted ? 'text-teal-700' : 'text-slate-400'}`}>
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
                      <div className="w-full lg:w-48 bg-teal-50 rounded-sm p-4 border border-teal-100">
                        <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest mb-3">
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
                          className="w-full py-2 bg-white text-[10px] font-bold text-teal-900 border border-teal-200 rounded-sm hover:bg-teal-900 hover:text-white hover:border-teal-900 transition-colors uppercase flex items-center justify-center gap-1"
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
              <h2 className="text-xl font-bold text-teal-900 mb-6 font-sans">{t('profile.tab.profile')}</h2>
              <form onSubmit={handleUpdateProfile} className="max-w-2xl space-y-6 bg-white p-8 border border-teal-100 rounded-sm">
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
                    className="w-full px-4 py-3 bg-teal-50 border-none focus:ring-2 focus:ring-teal-900 rounded-sm text-teal-900"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('profile.form.phone')}</label>
                  <input 
                    type="tel" 
                    value={profileForm.phone} 
                    onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-teal-50 border-none focus:ring-2 focus:ring-teal-900 rounded-sm text-teal-900"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('profile.form.address')}</label>
                  <textarea 
                    value={profileForm.address} 
                    onChange={e => setProfileForm({...profileForm, address: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 bg-teal-50 border-none focus:ring-2 focus:ring-teal-900 rounded-sm text-teal-900"
                  ></textarea>
                </div>
                
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full bg-teal-900 text-white px-8 py-4 font-bold hover:opacity-90 transition-all rounded-sm disabled:opacity-50 text-lg shadow-md mt-4"
                >
                  {isSaving ? t('profile.form.saving') : t('profile.form.save')}
                </button>
              </form>

              {/* Password Management Section */}
              <div className="mt-12 max-w-2xl bg-white p-8 border border-teal-100 rounded-sm">
                <h3 className="text-xl font-bold text-teal-900 mb-6 font-sans">{t('profile.password.title')}</h3>
                
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
                        className="w-full px-4 py-3 bg-teal-50 border-none focus:ring-2 focus:ring-teal-900 rounded-sm text-teal-900"
                      />
                      <button 
                        type="button"
                        onClick={handleRequestForgotCode}
                        disabled={isSendingCode}
                        className="mt-2 text-xs font-bold text-teal-700 hover:underline disabled:opacity-50"
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
                        className="w-full px-4 py-3 bg-teal-50 border-none focus:ring-2 focus:ring-teal-900 rounded-sm text-teal-900"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('profile.password.confirm')}</label>
                      <input 
                        type="password" 
                        required
                        value={passwordForm.confirmPassword} 
                        onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        className="w-full px-4 py-3 bg-teal-50 border-none focus:ring-2 focus:ring-teal-900 rounded-sm text-teal-900"
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isChangingPassword}
                      className="w-full bg-teal-900 text-white px-8 py-4 font-bold hover:opacity-90 transition-all rounded-sm disabled:opacity-50 text-lg shadow-md mt-4"
                    >
                      {isChangingPassword ? t('auth.loading') : t('profile.password.changeBtn')}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetWithCode} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 font-bold text-teal-800">{t('profile.password.codeLabel')}</label>
                      <input 
                        type="text" 
                        required
                        maxLength={6}
                        value={forgotCode} 
                        onChange={e => setForgotCode(e.target.value)}
                        className="w-full px-4 py-3 bg-teal-50 border-none focus:ring-2 focus:ring-teal-900 rounded-sm text-teal-900 font-mono tracking-[0.5em] text-center text-xl"
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
                        className="w-full px-4 py-3 bg-teal-50 border-none focus:ring-2 focus:ring-teal-900 rounded-sm text-teal-900"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('profile.password.confirm')}</label>
                      <input 
                        type="password" 
                        required
                        value={passwordForm.confirmPassword} 
                        onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        className="w-full px-4 py-3 bg-teal-50 border-none focus:ring-2 focus:ring-teal-900 rounded-sm text-teal-900"
                      />
                    </div>

                    <div className="flex gap-4">
                      <button 
                        type="submit" 
                        disabled={isChangingPassword}
                        className="w-full bg-teal-900 text-white px-8 py-4 font-bold hover:opacity-90 transition-all rounded-sm disabled:opacity-50 text-lg shadow-md mt-4"
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
              <h2 className="text-xl font-bold text-teal-900 mb-6 font-sans">{t('profile.tab.orders')}</h2>
            {loading ? (
              <p className="text-slate-500">{t('profile.orders.loading')}</p>
            ) : orders.length === 0 ? (
              <p className="text-slate-500">{t('profile.orders.empty')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-teal-100">
                      <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('profile.orders.id')}</th>
                      <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('profile.orders.date')}</th>
                      <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('profile.orders.status')}</th>
                      <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('profile.orders.total')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {orders.map(order => (
                      <React.Fragment key={order.id}>
                        <tr 
                          className="border-b border-teal-50 hover:bg-teal-50/50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedOrderDetails(order);
                            setIsOrderDetailModalOpen(true);
                          }}
                        >
                          <td className="py-4 font-bold text-teal-900">{order.id}</td>
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
                           <td className="py-4 font-bold text-teal-900">{Number(order.total).toLocaleString('vi-VN')} VND</td>
                        </tr>
                        {order.notes && (
                          <tr className="border-b border-teal-50 bg-teal-50/20">
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

          {activeTab === 'wishlist' && (
            <section>
              <h2 className="text-xl font-bold text-teal-900 mb-6 font-sans">{t('profile.tab.wishlist')}</h2>
              {wishlistItems.length === 0 ? (
                <div className="text-center py-12 p-6 bg-teal-50 rounded-sm border border-teal-100">
                  <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">Bạn chưa có sản phẩm yêu thích nào.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistItems.map(p => (
                    <ProductCard 
                      key={p.id} 
                      product={p} 
                      onClick={(product) => {
                        setSelectedProduct(product);
                        setView('detail');
                      }} 
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'vouchers' && (
            <section>
              <h2 className="text-xl font-bold text-teal-900 mb-6 font-sans">{t('profile.vouchers.title')}</h2>
              {vouchers.length === 0 ? (
                <div className="text-center py-12 p-6 bg-teal-50 rounded-sm border border-teal-100">
                  <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">{t('profile.vouchers.empty')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {vouchers.map(v => (
                    <div key={v.id} className="bg-white border-2 border-dashed border-teal-200 rounded-lg p-6 flex flex-col justify-between hover:border-teal-500 transition-colors">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-2xl font-black text-teal-900 tracking-wider font-mono border-2 border-dashed border-teal-300 bg-teal-50 px-4 py-1.5 rounded-lg shadow-sm">
                            {v.code}
                          </h3>
                          <span className="bg-gradient-to-r from-teal-600 to-emerald-500 text-white text-lg font-bold px-4 py-1.5 rounded-full shadow-md whitespace-nowrap ml-4">
                             - {v.type === 'percent' ? `${Number(v.discount) * 100}%` : `${Number(v.discount).toLocaleString('vi-VN')} đ`}
                          </span>
                        </div>
                        {v.min_order_value > 0 ? (
                          <p className="text-sm font-bold text-gray-600">
                             Đơn tối thiểu: <span className="text-teal-700">{Number(v.min_order_value).toLocaleString('vi-VN')} đ</span>
                          </p>
                        ) : (
                          <p className="text-sm font-bold text-teal-600">Không giới hạn đơn hàng</p>
                        )}
                        {v.max_discount_amount > 0 && (
                          <p className="text-sm font-bold text-red-500 mt-1">
                             Giảm tối đa: <span>{Number(v.max_discount_amount).toLocaleString('vi-VN')} đ</span>
                          </p>
                        )}
                        <span className="text-[10px] text-gray-400 mt-3 block uppercase tracking-wider font-semibold">
                          {t('profile.vouchers.ready')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Modal Overlay */}
          {isOrderDetailModalOpen && selectedOrderDetails && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-teal-900/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Modal Header */}
                <div className="p-6 border-b border-teal-50 flex items-center justify-between bg-teal-50/30">
                  <div>
                    <h3 className="text-xl font-bold text-teal-900 font-sans">{t('profile.orderDetail.title')}</h3>
                    <p className="text-xs text-teal-600 font-bold mt-1 uppercase tracking-wider">#{selectedOrderDetails.id}</p>
                  </div>
                  <button 
                    onClick={() => setIsOrderDetailModalOpen(false)}
                    className="p-2 hover:bg-teal-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-teal-900" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-8">
                    {/* Order Tracking Timeline */}
                    <div>
                      <h4 className="font-bold text-teal-900 mb-6 uppercase tracking-widest text-xs uppercase">Trạng Thái Đơn Hàng</h4>
                      <div className="pt-2 pb-2">
                            <div className="relative mt-4">
                              <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-100"></div>
                              {(() => {
                                const s = selectedOrderDetails.status?.toLowerCase().trim() || '';
                                if (s === 'cancelled' || s === 'đã hủy') {
                                  return (
                                    <div className="bg-red-50 text-red-700 p-4 rounded border border-red-100 flex items-center justify-center gap-3 relative z-10 mx-4">
                                      <X className="w-5 h-5" />
                                      <span className="font-bold">Đơn hàng đã bị hủy</span>
                                    </div>
                                  );
                                }
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
                                      className="absolute top-5 left-0 h-0.5 bg-teal-600 transition-all duration-500 z-10"
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
                                          <div key={step.id} className="flex flex-col items-center gap-2 relative z-10 bg-white">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border-2 ${
                                              isActive ? 'bg-teal-900 text-white border-teal-900 shadow-lg scale-110' :
                                              isCompleted ? 'bg-teal-100 text-teal-700 border-teal-200' :
                                              'bg-white text-slate-300 border-slate-100'
                                            }`}>
                                              <step.icon className="w-5 h-5" />
                                            </div>
                                            <p className={`text-[10px] font-bold uppercase whitespace-nowrap bg-white px-1 ${isActive ? 'text-teal-900' : isCompleted ? 'text-teal-700' : 'text-slate-400'}`}>
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

                    {/* Product List */}
                    <div className="space-y-4">
                      {selectedOrderDetails.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-4 bg-gray-50 p-4 rounded-sm border border-gray-100 hover:border-teal-200 transition-colors">
                          <div className="w-20 h-20 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
                            <img 
                              src={item.product_image || item.image || item.product?.image} 
                              alt={item.product?.name || item.name} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <div className="flex-1">
                        <h4 className="font-bold text-teal-900 text-sm">{item.product_name || item.product?.name || item.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">{item.product_category || item.category || item.product?.category}</p>
                        <div className="flex items-center justify-between mt-2">
                              <p className="text-xs font-bold text-slate-400">x{item.quantity}</p>
                               <p className="text-sm font-extrabold text-teal-900">{Number(item.price || 0).toLocaleString('vi-VN')}₫</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total Summary */}
                    <div className="border-t border-teal-100 pt-6 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Tổng phụ</span>
                        <span className="font-bold text-teal-900">{Number(selectedOrderDetails.subtotal || 0).toLocaleString('vi-VN')}₫</span>
                      </div>
                      {selectedOrderDetails.voucher_code && (
                        <>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Mã giảm giá</span>
                            <span className="font-bold text-teal-700">{selectedOrderDetails.voucher_code}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Mức giảm</span>
                            <span className="font-bold text-teal-700">
                              {selectedOrderDetails.voucher_type === 'percent' 
                                ? `${Number(selectedOrderDetails.voucher_discount || 0) * 100}%` 
                                : `${Number(selectedOrderDetails.voucher_discount || 0).toLocaleString('vi-VN')}₫`}
                            </span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between items-center text-sm border-t border-teal-50 pt-3">
                        <span className="text-teal-900 font-bold">{t('profile.orders.total')}</span>
                        <span className="text-lg font-extrabold text-teal-900">{Number(selectedOrderDetails.total || 0).toLocaleString('vi-VN')}₫</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-teal-50 bg-gray-50 flex justify-end">
                  <button 
                    onClick={() => setIsOrderDetailModalOpen(false)}
                    className="px-8 py-3 bg-teal-900 text-white text-xs font-bold rounded-sm hover:bg-teal-800 transition-colors uppercase tracking-widest shadow-lg"
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
