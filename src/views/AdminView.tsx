import React, { useState, useEffect } from 'react';
import { View, Product } from '../types';
import { Plus, Edit, Trash2, Check, X, Tag, Package, ShoppingBag, Search, Filter, ArrowUpDown, LayoutTemplate } from 'lucide-react';

interface AdminViewProps {
  setView: (view: View) => void;
  products: Product[];
  refreshProducts: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ setView, products, refreshProducts }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'vouchers' | 'promotions'>('products');
  
  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [receiptToView, setReceiptToView] = useState<string | null>(null);
  
  // Vouchers State
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [editingVoucher, setEditingVoucher] = useState<any | null>(null);
  const [isAddingVoucher, setIsAddingVoucher] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState<string | null>(null);
  const [voucherForm, setVoucherForm] = useState({ code: '', discount: 0, type: 'percent', is_active: true });

  // Promotions State
  const [promotions, setPromotions] = useState<any[]>([]);
  const [editingPromotion, setEditingPromotion] = useState<any | null>(null);
  const [isAddingPromotion, setIsAddingPromotion] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<string | null>(null);
  const [promotionForm, setPromotionForm] = useState({ title: '', subtitle: '', image: '', cta: '', order_index: 0 });

  // Products State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '', description: '', price: 0, category: 'Chủng tầm trung', collection: 'Nếp băng chủng', image: '', images: [], isNew: false, isPremium: false, isBestSeller: false
  });
  const [isDragging, setIsDragging] = useState(false);
  
  // Product Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCollection, setFilterCollection] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Derived Products
  const filteredAndSortedProducts = [...products]
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory ? p.category === filterCategory : true;
      const matchesCollection = filterCollection ? p.collection === filterCollection : true;
      return matchesSearch && matchesCategory && matchesCollection;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      return 0; // newest is default, assuming array is already in order
    });

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'vouchers') fetchVouchers();
    if (activeTab === 'promotions') fetchPromotions();
  }, [activeTab]);

  const fetchPromotions = async () => {
    try {
      const res = await fetch('/api/admin/promotions');
      const data = await res.json();
      setPromotions(data);
    } catch (err) {
      console.error('Failed to fetch promotions', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    }
  };

  const fetchVouchers = async () => {
    try {
      const res = await fetch('/api/admin/vouchers');
      const data = await res.json();
      setVouchers(data);
    } catch (err) {
      console.error('Failed to fetch vouchers', err);
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchOrders();
    } catch (err) {
      console.error('Failed to update order status', err);
    }
  };

  const confirmDeleteOrder = async (id: string) => {
    try {
      await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
      fetchOrders();
      setOrderToDelete(null);
    } catch (err) {
      console.error('Failed to delete order', err);
    }
  };

  const processFiles = (files: File[]) => {
    if (files.length === 0) return;

    const newImages: string[] = [];
    let processed = 0;

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        processed += 1;
        if (processed === files.length && newImages.length > 0) {
          updateFormImages(newImages);
        }
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          newImages.push(reader.result);
        }
        processed += 1;
        if (processed === files.length) {
          updateFormImages(newImages);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const updateFormImages = (newImages: string[]) => {
    setProductForm(prev => {
      const updatedImages = [...(prev.images || []), ...newImages];
      return {
        ...prev,
        images: updatedImages,
        image: updatedImages.length > 0 ? updatedImages[0] : prev.image
      };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files) as File[];
    processFiles(files);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setProductForm(prev => {
      const updatedImages = (prev.images || []).filter((_, index) => index !== indexToRemove);
      return {
        ...prev,
        images: updatedImages,
        image: updatedImages.length > 0 ? updatedImages[0] : ''
      };
    });
  };

  const handleSaveProduct = async () => {
    try {
      if (isAddingProduct) {
        const newProduct = { ...productForm, id: `prod-${Date.now()}` };
        await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProduct)
        });
      } else if (editingProduct) {
        await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productForm)
        });
      }
      setIsAddingProduct(false);
      setEditingProduct(null);
      refreshProducts();
    } catch (err) {
      console.error('Failed to save product', err);
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProductToDelete(id);
  };

  const confirmDeleteProduct = async (id: string) => {
    try {
      await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      refreshProducts();
      setProductToDelete(null);
    } catch (err) {
      console.error('Failed to delete product', err);
    }
  };

  const handleSaveVoucher = async () => {
    try {
      if (isAddingVoucher) {
        const newVoucher = { ...voucherForm, id: `vouch-${Date.now()}` };
        await fetch('/api/admin/vouchers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newVoucher)
        });
      } else if (editingVoucher) {
        await fetch(`/api/admin/vouchers/${editingVoucher.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(voucherForm)
        });
      }
      setIsAddingVoucher(false);
      setEditingVoucher(null);
      fetchVouchers();
    } catch (err) {
      console.error('Failed to save voucher', err);
    }
  };

  const handleDeleteVoucher = (id: string) => {
    setVoucherToDelete(id);
  };

  const confirmDeleteVoucher = async (id: string) => {
    try {
      await fetch(`/api/admin/vouchers/${id}`, { method: 'DELETE' });
      fetchVouchers();
      setVoucherToDelete(null);
    } catch (err) {
      console.error('Failed to delete voucher', err);
    }
  };

  const handleSavePromotion = async () => {
    try {
      if (isAddingPromotion) {
        await fetch('/api/admin/promotions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promotionForm)
        });
      } else if (editingPromotion) {
        await fetch(`/api/admin/promotions/${editingPromotion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promotionForm)
        });
      }
      setIsAddingPromotion(false);
      setEditingPromotion(null);
      fetchPromotions();
    } catch (err) {
      console.error('Failed to save promotion', err);
    }
  };

  const handleDeletePromotion = (id: string) => {
    setPromotionToDelete(id);
  };

  const confirmDeletePromotion = async (id: string) => {
    try {
      await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' });
      fetchPromotions();
      setPromotionToDelete(null);
    } catch (err) {
      console.error('Failed to delete promotion', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif text-jade-900">Bảng Điều Khiển Quản Trị</h1>
        <button onClick={() => setView('home')} className="text-jade-700 hover:text-jade-900">
          Trở về cửa hàng
        </button>
      </div>

      <div className="flex space-x-4 mb-8 border-b border-gray-200 pb-4">
        <button 
          onClick={() => setActiveTab('products')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'products' ? 'bg-jade-100 text-jade-900 font-bold' : 'text-gray-700 hover:bg-gray-100 font-medium'}`}
        >
          <Package size={18} />
          <span>Sản Phẩm</span>
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'orders' ? 'bg-jade-100 text-jade-900 font-bold' : 'text-gray-700 hover:bg-gray-100 font-medium'}`}
        >
          <ShoppingBag size={18} />
          <span>Đơn Hàng</span>
        </button>
        <button 
          onClick={() => setActiveTab('vouchers')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'vouchers' ? 'bg-jade-100 text-jade-900 font-bold' : 'text-gray-700 hover:bg-gray-100 font-medium'}`}
        >
          <Tag size={18} />
          <span>Mã Giảm Giá</span>
        </button>
        <button 
          onClick={() => setActiveTab('promotions')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'promotions' ? 'bg-jade-100 text-jade-900 font-bold' : 'text-gray-700 hover:bg-gray-100 font-medium'}`}
        >
          <LayoutTemplate size={18} />
          <span>Trang Chủ</span>
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quản Lý Sản Phẩm</h2>
            <button 
              onClick={() => {
                setIsAddingProduct(true);
                setEditingProduct(null);
                setProductForm({ name: '', description: '', price: 0, category: 'Chủng tầm trung', collection: 'Nếp băng chủng', image: '', images: [], isNew: false, isPremium: false, isBestSeller: false });
              }}
              className="flex items-center space-x-2 bg-jade-800 text-white px-4 py-2 rounded-md hover:bg-jade-900 transition-colors font-medium shadow-sm"
            >
              <Plus size={18} />
              <span>Thêm Sản Phẩm</span>
            </button>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-jade-500 focus:border-jade-500 outline-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter size={18} className="text-gray-500" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-jade-500 focus:border-jade-500 outline-none"
              >
                <option value="">Tất cả loại</option>
                <option value="Chủng tầm trung">Chủng tầm trung</option>
                <option value="Chủng tầm cao">Chủng tầm cao</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={filterCollection}
                onChange={(e) => setFilterCollection(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-jade-500 focus:border-jade-500 outline-none"
              >
                <option value="">Tất cả dòng</option>
                <option value="Nếp băng chủng">Nếp băng chủng</option>
                <option value="Băng chủng">Băng chủng</option>
                <option value="Thủy tinh chủng">Thủy tinh chủng</option>
                <option value="Mực dục">Mực dục</option>
                <option value="Hoa bay">Hoa bay</option>
                <option value="Tím tử la lan">Tím tử la lan</option>
                <option value="Xanh táo">Xanh táo</option>
                <option value="Xanh cây">Xanh cây</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <ArrowUpDown size={18} className="text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-jade-500 focus:border-jade-500 outline-none"
              >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
                <option value="name_asc">Tên: A-Z</option>
                <option value="name_desc">Tên: Z-A</option>
              </select>
            </div>
          </div>

          {(isAddingProduct || editingProduct) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-jade-900">{isAddingProduct ? 'Thêm Sản Phẩm Mới' : 'Chỉnh Sửa Sản Phẩm'}</h3>
                  <button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Tên</label>
                  <input type="text" value={productForm.name || ''} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-jade-500 focus:border-jade-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Giá (VND)</label>
                  <input type="number" value={productForm.price || 0} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-jade-500 focus:border-jade-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Loại Sản Phẩm</label>
                  <select value={productForm.category || ''} onChange={e => setProductForm({...productForm, category: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-jade-500 focus:border-jade-500 outline-none">
                    <option value="Chủng tầm trung">Chủng tầm trung</option>
                    <option value="Chủng tầm cao">Chủng tầm cao</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Dòng Sản Phẩm</label>
                  <select value={productForm.collection || ''} onChange={e => setProductForm({...productForm, collection: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-jade-500 focus:border-jade-500 outline-none">
                    <option value="Nếp băng chủng">Nếp băng chủng</option>
                    <option value="Băng chủng">Băng chủng</option>
                    <option value="Thủy tinh chủng">Thủy tinh chủng</option>
                    <option value="Mực dục">Mực dục</option>
                    <option value="Hoa bay">Hoa bay</option>
                    <option value="Tím tử la lan">Tím tử la lan</option>
                    <option value="Xanh táo">Xanh táo</option>
                    <option value="Xanh cây">Xanh cây</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-800 mb-1">Hình Ảnh</label>
                  <div 
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${isDragging ? 'border-jade-500 bg-jade-50' : 'border-gray-300 bg-white'}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-1 text-center">
                      <svg className={`mx-auto h-12 w-12 ${isDragging ? 'text-jade-500' : 'text-gray-400'}`} stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-jade-600 hover:text-jade-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-jade-500">
                          <span>Tải ảnh lên</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleImageUpload} />
                        </label>
                        <p className="pl-1">hoặc kéo thả vào đây</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF tối đa 10MB</p>
                    </div>
                  </div>
                  
                  {productForm.images && productForm.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-4">
                      {productForm.images.map((img, index) => (
                        <div key={index} className="relative group aspect-square rounded-md overflow-hidden border border-gray-200">
                          <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-800 mb-1">Mô Tả</label>
                  <textarea value={productForm.description || ''} onChange={e => setProductForm({...productForm, description: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 focus:ring-2 focus:ring-jade-500 focus:border-jade-500 outline-none" rows={3}></textarea>
                </div>
                <div className="flex items-center space-x-4 mt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={productForm.isNew || false} onChange={e => setProductForm({...productForm, isNew: e.target.checked})} className="rounded text-jade-600 focus:ring-jade-500 w-4 h-4" />
                    <span className="text-sm font-semibold text-gray-800">Hàng Mới Về</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={productForm.isPremium || false} onChange={e => setProductForm({...productForm, isPremium: e.target.checked})} className="rounded text-jade-600 focus:ring-jade-500 w-4 h-4" />
                    <span className="text-sm font-semibold text-gray-800">Cao Cấp</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={productForm.isBestSeller || false} onChange={e => setProductForm({...productForm, isBestSeller: e.target.checked})} className="rounded text-jade-600 focus:ring-jade-500 w-4 h-4" />
                    <span className="text-sm font-semibold text-gray-800">Bán Chạy Nhất</span>
                  </label>
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-3 border-t pt-4">
                <button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">Hủy</button>
                <button onClick={handleSaveProduct} className="px-4 py-2 bg-jade-800 text-white rounded-md hover:bg-jade-900 font-medium">Lưu Sản Phẩm</button>
              </div>
            </div>
            </div>
          )}

          {productToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-xl font-bold text-red-600 mb-4">Xác Nhận Xóa</h3>
                <p className="text-gray-700 mb-6">Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác.</p>
                <div className="flex justify-end space-x-3">
                  <button onClick={() => setProductToDelete(null)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">Hủy</button>
                  <button onClick={() => confirmDeleteProduct(productToDelete)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium">Xóa</button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Sản Phẩm</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Loại Sản Phẩm</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Dòng Sản Phẩm</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Giá</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Hành Động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img className="h-10 w-10 rounded-md object-cover border border-gray-200" src={product.image} alt="" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">{product.name}</div>
                          <div className="text-xs font-medium text-gray-500">{product.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{product.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{product.collection}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-jade-900">{product.price.toLocaleString()} VND</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => {
                          setEditingProduct(product);
                          setProductForm({
                            ...product,
                            images: product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : [])
                          });
                          setIsAddingProduct(false);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quản Lý Đơn Hàng</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Mã Đơn Hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Khách Hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ngày</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tổng Cộng</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Trạng Thái</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Cập Nhật Trạng Thái</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Hành Động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map(order => (
                  <React.Fragment key={order.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{order.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                        {order.user_email.startsWith('guest_') ? (
                          <span className="flex items-center gap-1">
                            {order.user_email.replace('guest_', '')}
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Khách</span>
                          </span>
                        ) : (
                          order.user_email
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-jade-900">{order.total.toLocaleString()} VND</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${order.status === 'Delivered' || order.status === 'Đã Giao' ? 'bg-green-100 text-green-800' : 
                            order.status === 'Shipped' || order.status === 'Đang Giao' ? 'bg-blue-100 text-blue-800' : 
                            order.status === 'Processing' || order.status === 'Đang Xử Lý' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'}`}>
                          {order.status === 'Pending' ? 'Chờ Xử Lý' : 
                          order.status === 'Processing' ? 'Đang Xử Lý' : 
                          order.status === 'Shipped' ? 'Đang Giao' : 
                          order.status === 'Delivered' ? 'Đã Giao' : 
                          order.status === 'Cancelled' ? 'Đã Hủy' : order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <select 
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="border border-gray-300 rounded-md text-sm p-1"
                        >
                          <option value="Pending">Chờ Xử Lý</option>
                          <option value="Processing">Đang Xử Lý</option>
                          <option value="Shipped">Đang Giao</option>
                          <option value="Delivered">Đã Giao</option>
                          <option value="Cancelled">Đã Hủy</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {order.receipt && (
                          <button 
                            onClick={() => setReceiptToView(order.receipt)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                            title="Xem biên lai"
                          >
                            <span className="material-symbols-outlined text-lg align-middle">receipt</span>
                          </button>
                        )}
                        <button 
                          onClick={() => setOrderToDelete(order.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Xóa đơn hàng"
                        >
                          <Trash2 size={18} className="inline" />
                        </button>
                      </td>
                    </tr>
                    {order.notes && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-6 py-2 text-sm text-gray-600">
                          <span className="font-semibold">Ghi chú:</span> {order.notes}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
                  <button onClick={() => confirmDeleteOrder(orderToDelete)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium">Xóa</button>
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
                <h3 className="text-lg font-bold text-jade-900 mb-4">Biên Lai Thanh Toán</h3>
                <img src={receiptToView} alt="Biên lai" className="max-w-full h-auto object-contain" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vouchers Tab */}
      {activeTab === 'vouchers' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quản Lý Mã Giảm Giá</h2>
            <button 
              onClick={() => {
                setIsAddingVoucher(true);
                setEditingVoucher(null);
                setVoucherForm({ code: '', discount: 0, type: 'percent', is_active: true });
              }}
              className="flex items-center space-x-2 bg-jade-800 text-white px-4 py-2 rounded-md hover:bg-jade-900 transition-colors font-medium shadow-sm"
            >
              <Plus size={18} />
              <span>Thêm Mã Giảm Giá</span>
            </button>
          </div>

          {(isAddingVoucher || editingVoucher) && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
              <h3 className="text-xl font-bold text-jade-900 mb-4">{isAddingVoucher ? 'Thêm Mã Giảm Giá Mới' : 'Chỉnh Sửa Mã Giảm Giá'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Mã</label>
                  <input type="text" value={voucherForm.code} onChange={e => setVoucherForm({...voucherForm, code: e.target.value.toUpperCase()})} className="w-full border border-gray-300 rounded-md p-2 uppercase text-gray-900 font-medium focus:ring-2 focus:ring-jade-500 focus:border-jade-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Mức Giảm Giá</label>
                  <input type="number" value={voucherForm.discount} onChange={e => setVoucherForm({...voucherForm, discount: Number(e.target.value)})} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-jade-500 focus:border-jade-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Loại</label>
                  <select value={voucherForm.type} onChange={e => setVoucherForm({...voucherForm, type: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-jade-500 focus:border-jade-500 outline-none">
                    <option value="percent">Phần Trăm (%)</option>
                    <option value="fixed">Số Tiền Cố Định (VND)</option>
                  </select>
                </div>
                <div className="flex items-center mt-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={voucherForm.is_active} onChange={e => setVoucherForm({...voucherForm, is_active: e.target.checked})} className="rounded text-jade-600 focus:ring-jade-500 w-4 h-4" />
                    <span className="text-sm font-semibold text-gray-800">Hoạt Động</span>
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button onClick={() => { setIsAddingVoucher(false); setEditingVoucher(null); }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">Hủy</button>
                <button onClick={handleSaveVoucher} className="px-4 py-2 bg-jade-800 text-white rounded-md hover:bg-jade-900 font-medium">Lưu Mã Giảm Giá</button>
              </div>
            </div>
          )}

          {voucherToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-xl font-bold text-red-600 mb-4">Xác Nhận Xóa</h3>
                <p className="text-gray-700 mb-6">Bạn có chắc chắn muốn xóa mã giảm giá này không? Hành động này không thể hoàn tác.</p>
                <div className="flex justify-end space-x-3">
                  <button onClick={() => setVoucherToDelete(null)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">Hủy</button>
                  <button onClick={() => confirmDeleteVoucher(voucherToDelete)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium">Xóa</button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Mã</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Giảm Giá</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Trạng Thái</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Hành Động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vouchers.map(voucher => (
                  <tr key={voucher.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{voucher.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      {voucher.type === 'percent' ? `${voucher.discount * 100}%` : `${voucher.discount.toLocaleString()} VND`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${voucher.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {voucher.is_active ? 'Hoạt Động' : 'Không Hoạt Động'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => {
                          setEditingVoucher(voucher);
                          setVoucherForm(voucher);
                          setIsAddingVoucher(false);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteVoucher(voucher.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Promotions Tab */}
      {activeTab === 'promotions' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quản Lý Trang Chủ (Khuyến Mãi)</h2>
            <button 
              onClick={() => {
                setIsAddingPromotion(true);
                setEditingPromotion(null);
                setPromotionForm({ title: '', subtitle: '', image: '', cta: '', order_index: 0 });
              }}
              className="flex items-center space-x-2 bg-jade-800 text-white px-4 py-2 rounded-md hover:bg-jade-900 transition-colors font-medium shadow-sm"
            >
              <Plus size={18} />
              <span>Thêm Khuyến Mãi</span>
            </button>
          </div>

          {(isAddingPromotion || editingPromotion) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-jade-900">{isAddingPromotion ? 'Thêm Khuyến Mãi Mới' : 'Chỉnh Sửa Khuyến Mãi'}</h3>
                  <button onClick={() => { setIsAddingPromotion(false); setEditingPromotion(null); }} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Tiêu Đề</label>
                    <input type="text" value={promotionForm.title} onChange={e => setPromotionForm({...promotionForm, title: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-jade-500 focus:border-jade-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Tiêu Đề Phụ</label>
                    <input type="text" value={promotionForm.subtitle} onChange={e => setPromotionForm({...promotionForm, subtitle: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-jade-500 focus:border-jade-500 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-800 mb-1">Hình Ảnh</label>
                    <div 
                      className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${isDragging ? 'border-jade-500 bg-jade-50' : 'border-gray-300 bg-white'}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith('image/')) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setPromotionForm(prev => ({ ...prev, image: reader.result as string }));
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    >
                      <div className="space-y-1 text-center">
                        <svg className={`mx-auto h-12 w-12 ${isDragging ? 'text-jade-500' : 'text-gray-400'}`} stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label htmlFor="promo-file-upload" className="relative cursor-pointer rounded-md font-medium text-jade-600 hover:text-jade-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-jade-500">
                            <span>Tải ảnh lên</span>
                            <input id="promo-file-upload" name="promo-file-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (typeof reader.result === 'string') {
                                    setPromotionForm(prev => ({ ...prev, image: reader.result as string }));
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }} />
                          </label>
                          <p className="pl-1">hoặc kéo thả vào đây</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF tối đa 10MB</p>
                      </div>
                    </div>
                    {promotionForm.image && (
                      <div className="mt-4 relative group aspect-video rounded-md overflow-hidden border border-gray-200">
                        <img src={promotionForm.image} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPromotionForm(prev => ({ ...prev, image: '' }))}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Nút Kêu Gọi Hành Động (CTA)</label>
                    <input type="text" value={promotionForm.cta} onChange={e => setPromotionForm({...promotionForm, cta: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-jade-500 focus:border-jade-500 outline-none" />
                  </div>
                </div>
                <div className="mt-8 flex justify-end space-x-3 border-t pt-4">
                  <button onClick={() => { setIsAddingPromotion(false); setEditingPromotion(null); }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">Hủy</button>
                  <button onClick={handleSavePromotion} className="px-4 py-2 bg-jade-800 text-white rounded-md hover:bg-jade-900 font-medium">Lưu Khuyến Mãi</button>
                </div>
              </div>
            </div>
          )}

          {promotionToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-xl font-bold text-red-600 mb-4">Xác Nhận Xóa</h3>
                <p className="text-gray-700 mb-6">Bạn có chắc chắn muốn xóa khuyến mãi này không? Hành động này không thể hoàn tác.</p>
                <div className="flex justify-end space-x-3">
                  <button onClick={() => setPromotionToDelete(null)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">Hủy</button>
                  <button onClick={() => confirmDeletePromotion(promotionToDelete)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium">Xóa</button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Hình Ảnh</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tiêu Đề</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Hành Động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {promotions.map(promo => (
                  <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img src={promo.image} alt={promo.title} className="h-16 w-32 object-cover rounded-md" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{promo.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => {
                          setEditingPromotion(promo);
                          setPromotionForm(promo);
                          setIsAddingPromotion(false);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeletePromotion(promo.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
