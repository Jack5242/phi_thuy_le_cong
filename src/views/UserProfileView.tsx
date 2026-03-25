import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { motion } from 'framer-motion';
import { Package, DollarSign, Clock } from 'lucide-react';

const UserProfileView: React.FC = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) return;
      try {
        const [ordersRes, statsRes] = await Promise.all([
          fetch('/api/users/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/users/stats', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (ordersRes.ok) setOrders(await ordersRes.json());
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setTotalSpent(stats.totalSpent);
        }
      } catch (error) {
        console.error('Failed to fetch user data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [token]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto px-4 py-12"
    >
      <h1 className="text-4xl font-serif text-emerald-900 mb-8">My Account</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-full">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Spent</p>
            <p className="text-2xl font-bold text-gray-900">${Number(totalSpent).toLocaleString('vi-VN')}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-full">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-full">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Member Since</p>
            <p className="text-lg font-bold text-gray-900">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-serif text-emerald-900 mb-6">Order History</h2>
      {orders.length === 0 ? (
        <p className="text-gray-500 bg-white p-8 rounded-xl text-center border border-gray-100">You haven't placed any orders yet.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-mono font-medium">{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-medium">${Number(order.total).toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <ul className="divide-y divide-gray-100">
                  {order.items.map((item: any) => (
                    <li key={item.id} className="py-3 flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Product ID: {item.product_id}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-medium text-gray-900">{Number(item.price).toLocaleString('vi-VN')} VND</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default UserProfileView;
