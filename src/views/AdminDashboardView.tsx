import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { motion } from 'framer-motion';
import { Package, ShoppingBag, Tag, Edit, Trash2, Plus, X } from 'lucide-react';

const AdminDashboardView: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'vouchers'>('products');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [receiptToView, setReceiptToView] = useState<string | null>(null);

  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [prodRes, ordRes, vouchRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/admin/orders', { headers }),
        fetch('/api/admin/vouchers', { headers })
      ]);

      if (prodRes.ok) setProducts(await prodRes.json());
      if (ordRes.ok) setOrders(await ordRes.json());
      if (vouchRes.ok) setVouchers(await vouchRes.json());
    } catch (error) {
      console.error('Failed to fetch admin data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (error) {
      console.error('Failed to update order status');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await fetch(`/api/admin/orders/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
      setOrderToDelete(null);
    } catch (error) {
      console.error('Failed to delete order');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) return;
    try {
      await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Failed to delete product');
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mã giảm giá này không?')) return;
    try {
      await fetch(`/api/admin/vouchers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Failed to delete voucher');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 py-12"
    >
      <h1 className="text-4xl font-serif text-emerald-900 mb-8">Bảng Điều Khiển Quản Trị</h1>

      <div className="flex space-x-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-4 px-4 font-medium flex items-center space-x-2 ${activeTab === 'products' ? 'border-b-2 border-emerald-800 text-emerald-800' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Package size={20} /> <span>Sản Phẩm</span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-4 px-4 font-medium flex items-center space-x-2 ${activeTab === 'orders' ? 'border-b-2 border-emerald-800 text-emerald-800' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <ShoppingBag size={20} /> <span>Đơn Hàng</span>
        </button>
        <button
          onClick={() => setActiveTab('vouchers')}
          className={`pb-4 px-4 font-medium flex items-center space-x-2 ${activeTab === 'vouchers' ? 'border-b-2 border-emerald-800 text-emerald-800' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Tag size={20} /> <span>Mã Giảm Giá</span>
        </button>
      </div>

      <div>
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-serif text-emerald-900">Quản Lý Sản Phẩm</h2>
              <button className="bg-emerald-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-emerald-900 transition-colors">
                <Plus size={20} /> <span>Thêm Sản Phẩm</span>
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 font-medium text-gray-600 text-sm">ID</th>
                    <th className="p-4 font-medium text-gray-600 text-sm">Tên</th>
                    <th className="p-4 font-medium text-gray-600 text-sm">Giá</th>
                    <th className="p-4 font-medium text-gray-600 text-sm">Loại Sản Phẩm</th>
                    <th className="p-4 font-medium text-gray-600 text-sm">Dòng Sản Phẩm</th>
                    <th className="p-4 font-medium text-gray-600 text-sm text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="p-4 font-mono text-sm text-gray-500">{product.id}</td>
                      <td className="p-4 font-medium text-gray-900">{product.name}</td>
                      <td className="p-4 text-gray-600">{product.price.toLocaleString()} VND</td>
                      <td className="p-4 text-gray-600">{product.category}</td>
                      <td className="p-4 text-gray-600">{product.collection}</td>
                      <td className="p-4 text-right space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 p-2"><Edit size={18} /></button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-800 p-2"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h2 className="text-2xl font-serif text-emerald-900 mb-6">Quản Lý Đơn Hàng</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 font-medium text-gray-600 text-sm">Mã Đơn Hàng</th>
                    <th className="p-4 font-medium text-gray-600 text-sm">Email Khách Hàng</th>
                    <th className="p-4 font-medium text-gray-600 text-sm">Tổng Cộng</th>
                    <th className="p-4 font-medium text-gray-600 text-sm">Ngày</th>
                    <th className="p-4 font-medium text-gray-600 text-sm">Trạng Thái</th>
                    <th className="p-4 font-medium text-gray-600 text-sm text-right">Cập Nhật Trạng Thái</th>
                    <th className="p-4 font-medium text-gray-600 text-sm text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="p-4 font-mono text-sm text-gray-500">{order.id}</td>
                      <td className="p-4 text-gray-600">
                        {order.user_email.startsWith('guest_') ? (
                          <span className="flex items-center gap-1">
                            {order.user_email.replace('guest_', '')}
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Khách</span>
                          </span>
                        ) : (
                          order.user_email
                        )}
                      </td>
                      <td className="p-4 font-medium text-gray-900">{order.total.toLocaleString()} VND</td>
                      <td className="p-4 text-gray-600">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Delivered' || order.status === 'Đã Giao' ? 'bg-green-100 text-green-800' :
                          order.status === 'Cancelled' || order.status === 'Đã Hủy' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status === 'Pending' ? 'Chờ Xử Lý' : 
                           order.status === 'Processing' ? 'Đang Xử Lý' : 
                           order.status === 'Shipped' ? 'Đang Giao' : 
                           order.status === 'Delivered' ? 'Đã Giao' : 
                           order.status === 'Cancelled' ? 'Đã Hủy' : order.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <select 
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className="border border-gray-300 rounded-md text-sm px-2 py-1 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value="Pending">Chờ Xử Lý</option>
                          <option value="Processing">Đang Xử Lý</option>
                          <option value="Shipped">Đang Giao</option>
                          <option value="Delivered">Đã Giao</option>
                          <option value="Cancelled">Đã Hủy</option>
                        </select>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {order.receipt && (
                          <button 
                            onClick={() => setReceiptToView(order.receipt)}
                            className="text-blue-600 hover:text-blue-800 p-2"
                            title="Xem biên lai"
                          >
                            <span className="material-symbols-outlined text-lg align-middle">receipt</span>
                          </button>
                        )}
                        <button 
                          onClick={() => setOrderToDelete(order.id)}
                          className="text-red-600 hover:text-red-800 p-2"
                          title="Xóa đơn hàng"
                        >
                          <Trash2 size={18} className="inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Delete Order Modal */}
            {orderToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                  <h3 className="text-xl font-bold text-red-600 mb-4">Xác Nhận Xóa Đơn Hàng</h3>
                  <p className="text-gray-700 mb-6">Bạn có chắc chắn muốn xóa đơn hàng {orderToDelete} không? Hành động này không thể hoàn tác.</p>
                  <div className="flex justify-end space-x-3">
                    <button onClick={() => setOrderToDelete(null)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">Hủy</button>
                    <button onClick={() => handleDeleteOrder(orderToDelete)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium">Xóa</button>
                  </div>
                </div>
              </div>
            )}

            {/* View Receipt Modal */}
            {receiptToView && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setReceiptToView(null)}>
                <div className="bg-white p-4 rounded-lg shadow-xl max-w-3xl max-h-[90vh] overflow-auto relative" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => setReceiptToView(null)}
                    className="absolute top-2 right-2 bg-white/80 rounded-full p-1 text-gray-800 hover:bg-gray-200"
                  >
                    <X size={24} />
                  </button>
                  <h3 className="text-lg font-bold text-emerald-900 mb-4">Biên Lai Thanh Toán</h3>
                  <img src={receiptToView} alt="Biên lai" className="max-w-full h-auto object-contain" />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'vouchers' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-serif text-emerald-900">Quản Lý Mã Giảm Giá</h2>
              <button className="bg-emerald-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-emerald-900 transition-colors">
                <Plus size={20} /> <span>Thêm Mã Giảm Giá</span>
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 font-medium text-gray-600 text-sm">Mã</th>
                    <th className="p-4 font-medium text-gray-600 text-sm">Loại</th>
                    <th className="p-4 font-medium text-gray-600 text-sm">Giá Trị</th>
                    <th className="p-4 font-medium text-gray-600 text-sm">Đơn Tối Thiểu</th>
                    <th className="p-4 font-medium text-gray-600 text-sm">Trạng Thái</th>
                    <th className="p-4 font-medium text-gray-600 text-sm text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vouchers.map(voucher => (
                    <tr key={voucher.id} className="hover:bg-gray-50">
                      <td className="p-4 font-mono font-bold text-emerald-800">{voucher.code}</td>
                      <td className="p-4 text-gray-600 capitalize">{voucher.discount_type === 'percentage' ? 'Phần trăm' : 'Cố định'}</td>
                      <td className="p-4 font-medium text-gray-900">
                        {voucher.discount_type === 'percentage' ? `${voucher.discount_value}%` : `${voucher.discount_value.toLocaleString()} VND`}
                      </td>
                      <td className="p-4 text-gray-600">{voucher.min_purchase.toLocaleString()} VND</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${voucher.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {voucher.is_active ? 'Hoạt Động' : 'Không Hoạt Động'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 p-2"><Edit size={18} /></button>
                        <button onClick={() => handleDeleteVoucher(voucher.id)} className="text-red-600 hover:text-red-800 p-2"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminDashboardView;
