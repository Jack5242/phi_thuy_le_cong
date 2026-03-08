import React, { useState, useEffect } from 'react';
import { View, User } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ProfileViewProps {
  user: User;
  token: string;
  onLogout: () => void;
  setView: (view: View) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, token, onLogout, setView }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'orders'>('overview');
  const { t } = useLanguage();
  
  const [profileForm, setProfileForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    address: user.address || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

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
        setSaveMessage(t('profile.form.success'));
        // Update local user object in App.tsx would be ideal here, but we'll just show success
      } else {
        setSaveMessage(t('profile.form.error'));
      }
    } catch (error) {
      setSaveMessage(t('profile.form.connError'));
    } finally {
      setIsSaving(false);
    }
  };

  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 bg-jade-50 rounded-sm border border-jade-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('profile.overview.totalOrders')}</p>
                  <p className="text-2xl font-extrabold text-jade-900">{orders.length}</p>
                </div>
                <div className="p-6 bg-jade-50 rounded-sm border border-jade-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('profile.overview.totalSpent')}</p>
                  <p className="text-2xl font-extrabold text-jade-900">{totalSpent.toLocaleString()} VND</p>
                </div>
                <div className="p-6 bg-jade-50 rounded-sm border border-jade-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('profile.overview.tier')}</p>
                  <p className="text-2xl font-extrabold text-jade-700">{totalSpent > 10000 ? t('profile.overview.tier.elite') : t('profile.overview.tier.member')}</p>
                </div>
              </div>
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
                              order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                              order.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {order.status}
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
        </div>
      </div>
    </div>
  );
};
