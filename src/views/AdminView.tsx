import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { View, Product } from '../types';
import { Plus, Edit, Trash2, Check, X, Tag, Package, ShoppingBag, Search, Filter, ArrowUpDown, LayoutTemplate, BarChart3, FileText, Settings, User, Mail, Lock, ShieldCheck } from 'lucide-react';
import { validatePassword } from '../utils/validation';
import { useLanguage } from '../context/LanguageContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface AdminViewProps {
  setView: (view: View) => void;
  products: Product[];
  refreshProducts: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ setView, products, refreshProducts }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'products' | 'collections' | 'orders' | 'vouchers' | 'promotions' | 'analytics' | 'blogs' | 'settings'>('products');

  // Admin Auth State
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [isAdminForgotPassword, setIsAdminForgotPassword] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Settings & Admin Management State
  const [settingEmail, setSettingEmail] = useState('');
  const [settingCurrentPassword, setSettingCurrentPassword] = useState('');
  const [settingNewPassword, setSettingNewPassword] = useState('');
  const [settingsMessage, setSettingsMessage] = useState({ type: '', text: '' });

  const [allAdmins, setAllAdmins] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [adminManagementMsg, setAdminManagementMsg] = useState({ type: '', text: '' });

  // Bank Settings State
  const [bankSettings, setBankSettings] = useState({ bankName: '', bankOwner: '', bankNumber: '', bankQR: '' });
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [isSavingBankSettings, setIsSavingBankSettings] = useState(false);
  const [bankSettingsMessage, setBankSettingsMessage] = useState({ type: '', text: '' });

  // Social Settings State
  const [socialSettings, setSocialSettings] = useState({ facebook: '', tiktok: '', instagram: '', telegram: '', zalo: '' });
  const [isSavingSocialSettings, setIsSavingSocialSettings] = useState(false);
  const [socialSettingsMessage, setSocialSettingsMessage] = useState({ type: '', text: '' });

  // Contact Settings State
  const [contactSettings, setContactSettings] = useState({ address: '', phone: '', email: '', workingHours: '' });
  const [isSavingContactSettings, setIsSavingContactSettings] = useState(false);
  const [contactSettingsMessage, setContactSettingsMessage] = useState({ type: '', text: '' });

  // Registration Voucher Settings State


  useEffect(() => {
    const token = sessionStorage.getItem('adminToken');
    const savedAdmin = sessionStorage.getItem('adminUser');
    if (token && savedAdmin) {
      setIsAdminAuth(true);
      setAdminToken(token);
      const parsed = JSON.parse(savedAdmin);
      setSettingEmail(parsed.email);
    }
  }, []);

  const fetchAllAdmins = async () => {
    try {
      const res = await fetch('/api/admin/admins', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllAdmins(data);
      }
    } catch (err) {
      console.error('Failed to fetch admins', err);
    }
  };

  useEffect(() => {
    if (isAdminAuth && adminToken) {
      fetchAllAdmins();
    }
  }, [isAdminAuth, adminToken]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setIsAdminAuth(true);
        setAdminToken(data.token);
        sessionStorage.setItem('adminToken', data.token);
        sessionStorage.setItem('adminUser', JSON.stringify(data.admin));
        setSettingEmail(data.admin.email);
      } else {
        setLoginError(data.error || 'Sai thông tin đăng nhập');
      }
    } catch (err) {
      setLoginError('Lỗi máy chủ');
    }
  };

  const handleAdminForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSendingReset) return;
    setLoginError('');
    setIsSendingReset(true);
    try {
      const res = await fetch('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail })
      });
      if (res.ok) {
        alert('Email khôi phục mật khẩu đã được gửi.');
        setIsAdminForgotPassword(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setLoginError(data.error || 'Server error');
      }
    } catch (err) {
      setLoginError('Lỗi máy chủ');
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuth(false);
    setAdminToken('');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMessage({ type: '', text: '' });

    if (settingNewPassword) {
      const passVal = validatePassword(settingNewPassword);
      if (!passVal.isValid) {
        alert(passVal.message);
        return;
      }
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          newEmail: settingEmail,
          currentPassword: settingCurrentPassword,
          newPassword: settingNewPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Cập nhật thành công!');
        setAdminToken(data.token);
        sessionStorage.setItem('adminToken', data.token);
        sessionStorage.setItem('adminUser', JSON.stringify(data.admin));
        setSettingCurrentPassword('');
        setSettingNewPassword('');
      } else {
        alert(data.error || 'Cập nhật thất bại');
      }
    } catch (err) {
      alert('Lỗi máy chủ');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminManagementMsg({ type: '', text: '' });

    const passVal = validatePassword(newAdminPassword);
    if (!passVal.isValid) {
      alert(passVal.message);
      return;
    }

    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Tạo tài khoản quản trị mới thành công!');
        setNewAdminEmail('');
        setNewAdminPassword('');
        fetchAllAdmins();
      } else {
        alert(data.error || 'Không thể tạo tài khoản');
      }
    } catch (err) {
      alert('Lỗi máy chủ');
    }
  };

  const handleDeleteAdmin = async (id: number, email: string) => {
    if (email === settingEmail) {
      alert('Bạn không thể tự xóa tài khoản của chính mình!');
      return;
    }

    if (allAdmins.length <= 1) {
      alert('Không thể xóa quản trị viên cuối cùng!');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa quản trị viên "${email}" không?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/admins/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      if (res.ok) {
        alert('Đã xóa quản trị viên thành công!');
        fetchAllAdmins();
      } else {
        const data = await res.json();
        alert(data.error || 'Không thể xóa quản trị viên');
      }
    } catch (err) {
      alert('Lỗi máy chủ');
    }
  };

  const handleSaveBankSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBankSettings(true);
    setBankSettingsMessage({ type: '', text: '' });
    try {
      const formData = new FormData();
      formData.append('bankName', bankSettings.bankName);
      formData.append('bankOwner', bankSettings.bankOwner);
      formData.append('bankNumber', bankSettings.bankNumber);
      formData.append('bankQR_url', bankSettings.bankQR || '');
      if (qrFile) {
        formData.append('bankQR', qrFile);
      }

      const res = await fetch('/api/admin/settings/bank', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${adminToken}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setBankSettingsMessage({ type: 'success', text: 'Cập nhật thông tin ngân hàng thành công!' });
        if (data.bankQR) {
          setQrPreview(data.bankQR);
          setBankSettings(prev => ({ ...prev, bankQR: data.bankQR }));
        }
        setQrFile(null);
      } else {
        throw new Error(data.error || 'Failed');
      }
    } catch (err) {
      setBankSettingsMessage({ type: 'error', text: 'Lỗi khi cập nhật thông tin ngân hàng' });
    } finally {
      setIsSavingBankSettings(false);
    }
  };

  const handleSaveSocialSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSocialSettings(true);
    setSocialSettingsMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/admin/settings/social', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify(socialSettings)
      });
      if (res.ok) {
        setSocialSettingsMessage({ type: 'success', text: 'Cập nhật links mạng xã hội thành công!' });
      } else {
        setSocialSettingsMessage({ type: 'error', text: 'Cập nhật thất bại' });
      }
    } catch (err) {
      setSocialSettingsMessage({ type: 'error', text: 'Lỗi khi cập nhật mạng xã hội' });
    } finally {
      setIsSavingSocialSettings(false);
    }
  };

  const handleSaveContactSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContactSettings(true);
    setContactSettingsMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/admin/settings/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify(contactSettings)
      });
      if (res.ok) {
        setContactSettingsMessage({ type: 'success', text: 'Cập nhật thông tin liên hệ thành công!' });
      } else {
        setContactSettingsMessage({ type: 'error', text: 'Cập nhật thất bại' });
      }
    } catch (err) {
      setContactSettingsMessage({ type: 'error', text: 'Lỗi khi cập nhật thông tin liên hệ' });
    } finally {
      setIsSavingContactSettings(false);
    }
  };



  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [exportMonth, setExportMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [receiptToView, setReceiptToView] = useState<string | null>(null);
  const [orderToView, setOrderToView] = useState<any | null>(null);
  const [orderFeedback, setOrderFeedback] = useState<any>(null);

  const handleViewOrder = async (order: any) => {
    setOrderToView(order);
    setOrderFeedback(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/feedback`);
      const data = await res.json();
      if (res.ok && data && data.success !== false) {
        setOrderFeedback(data);
      }
    } catch (err) {
      console.error('Failed to fetch order feedback', err);
    }
  };

  // Vouchers State
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [editingVoucher, setEditingVoucher] = useState<any | null>(null);
  const [isAddingVoucher, setIsAddingVoucher] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState<string | null>(null);
  const [voucherForm, setVoucherForm] = useState<{ id?: string, code: string, discount: number, type: string, is_active: boolean, usage_limit: number | '', min_user_spending: number, min_order_value: number, max_discount_amount: number | '', is_hidden: boolean, is_registration: boolean }>({ code: '', discount: 0, type: 'percent', is_active: true, usage_limit: '', min_user_spending: 0, min_order_value: 0, max_discount_amount: '', is_hidden: false, is_registration: false });

  // Promotions State
  const [promotions, setPromotions] = useState<any[]>([]);
  const [editingPromotion, setEditingPromotion] = useState<any | null>(null);
  const [isAddingPromotion, setIsAddingPromotion] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<string | null>(null);
  const [promotionForm, setPromotionForm] = useState({ title: '', title_en: '', subtitle: '', subtitle_en: '', image: '', cta: '', cta_en: '', order_index: 0 });

  // Analytics State
  const [searchAnalytics, setSearchAnalytics] = useState<any[]>([]);

  // Blogs State
  const [blogs, setBlogs] = useState<any[]>([]);
  const [editingBlog, setEditingBlog] = useState<any | null>(null);
  const [isAddingBlog, setIsAddingBlog] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<string | null>(null);
  const [blogForm, setBlogForm] = useState({ title: '', slug: '', excerpt: '', content: '', author: 'Admin', is_published: false, image: '' });
  const [selectedBlogImage, setSelectedBlogImage] = useState<File | null>(null);

  // Products State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '', name_en: '', description: '', description_en: '', price: 0, category: 'Chủng tầm trung', collection: 'Nếp băng chủng', image: '', images: [], isNew: false, isPremium: false, isBestSeller: false, amount: 1
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [isAddingNewCollection, setIsAddingNewCollection] = useState(false);

  // Collections State
  const [dbCollections, setDbCollections] = useState<any[]>([]);
  const [editingCollection, setEditingCollection] = useState<any | null>(null);
  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<number | null>(null);
  const [collectionForm, setCollectionForm] = useState({ name: '', name_en: '', description: '', description_en: '', slug: '' });
  const [collectionMsg, setCollectionMsg] = useState({ type: '', text: '' });
  const [isSavingCollection, setIsSavingCollection] = useState(false);

  // Product Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCollection, setFilterCollection] = useState('');
  const [filterFeature, setFilterFeature] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Dynamic Options
  const existingCategories = React.useMemo(() => Array.from(new Set(products.map(p => p.category))).filter(Boolean), [products]);
  const existingCollections = React.useMemo(() => Array.from(new Set(products.map(p => p.collection))).filter(Boolean), [products]);

  const orderStats = useMemo(() => {
    const [year, month] = exportMonth.split('-').map(Number);
    const filtered = orders.filter(o => {
      const d = new Date(o.created_at);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    const totalIncome = filtered.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const totalProducts = filtered.reduce((acc, o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      return acc + items.reduce((iAcc: number, item: any) => iAcc + (item.quantity || 0), 0);
    }, 0);

    return { totalIncome, totalProducts, count: filtered.length };
  }, [orders, exportMonth]);

  // Derived Products
  const filteredAndSortedProducts = [...products]
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory ? p.category === filterCategory : true;
      const matchesCollection = filterCollection ? p.collection === filterCollection : true;
      let matchesFeature = true;
      if (filterFeature === 'new') matchesFeature = p.isNew === true;
      if (filterFeature === 'bestseller') matchesFeature = p.isBestSeller === true;
      if (filterFeature === 'premium') matchesFeature = p.isPremium === true;
      return matchesSearch && matchesCategory && matchesCollection && matchesFeature;
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
    if (activeTab === 'analytics') fetchAnalytics();
    if (activeTab === 'blogs') fetchBlogs();
    if (activeTab === 'collections') fetchDbCollections();
    if (activeTab === 'settings') {
      fetchBankSettings();
      fetchSocialSettings();
      fetchContactSettings();
    }
  }, [activeTab]);

  // Also fetch collections on products tab load so dropdown is populated
  useEffect(() => {
    if (activeTab === 'products') fetchDbCollections();
  }, [activeTab]);

  const fetchDbCollections = async () => {
    try {
      const res = await fetch('/api/collections');
      if (res.ok) setDbCollections(await res.json());
    } catch (err) {
      console.error('Failed to fetch collections', err);
    }
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCollection(true);
    setCollectionMsg({ type: '', text: '' });
    try {
      const method = editingCollection ? 'PUT' : 'POST';
      const url = editingCollection ? `/api/admin/collections/${editingCollection.id}` : '/api/admin/collections';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify(collectionForm)
      });
      const data = await res.json();
      if (res.ok) {
        setCollectionMsg({ type: 'success', text: editingCollection ? 'Cập nhật thành công!' : 'Thêm mới thành công!' });
        setEditingCollection(null);
        setIsAddingCollection(false);
        setCollectionForm({ name: '', name_en: '', description: '', description_en: '', slug: '' });
        fetchDbCollections();
      } else {
        setCollectionMsg({ type: 'error', text: data.error || 'Thao tác thất bại' });
      }
    } catch (err) {
      setCollectionMsg({ type: 'error', text: 'Lỗi máy chủ' });
    } finally {
      setIsSavingCollection(false);
    }
  };

  const confirmDeleteCollection = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/collections/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) { fetchDbCollections(); setCollectionToDelete(null); }
    } catch (err) {
      console.error('Failed to delete collection', err);
    }
  };



  const fetchBankSettings = async () => {
    try {
      const res = await fetch('/api/settings/bank');
      if (res.ok) {
        const data = await res.json();
        if (data && data.bankName) {
          setBankSettings(data);
          if (data.bankQR) setQrPreview(data.bankQR);
        }
      }
    } catch (err) {
      console.error('Failed to fetch bank settings', err);
    }
  };

  const fetchSocialSettings = async () => {
    try {
      const res = await fetch('/api/settings/social');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setSocialSettings({
            facebook: data.facebook || '',
            tiktok: data.tiktok || '',
            instagram: data.instagram || '',
            telegram: data.telegram || '',
            zalo: data.zalo || ''
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch social settings', err);
    }
  };

  const fetchContactSettings = async () => {
    try {
      const res = await fetch('/api/settings/contact');
      if (res.ok) {
        const data = await res.json();
        if (data) setContactSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch contact settings', err);
    }
  };

  const fetchBlogs = async () => {
    try {
      const res = await fetch('/api/admin/blogs');
      const data = await res.json();
      setBlogs(data);
    } catch (err) {
      console.error('Failed to fetch blogs', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/search-analytics');
      const data = await res.json();
      setSearchAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch search analytics', err);
    }
  };

  const clearAnalytics = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử thống kê tìm kiếm?')) return;
    try {
      await fetch('/api/admin/search-analytics', { method: 'DELETE' });
      setSearchAnalytics([]);
    } catch (err) {
      console.error('Failed to clear search analytics', err);
    }
  };

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

  const downloadOrdersExcel = () => {
    const [year, month] = exportMonth.split('-').map(Number);
    const filtered = orders.filter(o => {
      const d = new Date(o.created_at);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    if (filtered.length === 0) {
      alert('Không có đơn hàng nào trong tháng này.');
      return;
    }

    const data: any[] = [];
    let totalMonthlyProducts = 0;
    let totalMonthlyIncome = 0;
    let totalMonthlyDiscountAmount = 0;
    let totalMonthlyIncomeBeforeDiscount = 0;

    filtered.forEach(o => {
      const items = Array.isArray(o.items) ? o.items : [];
      const discount = Number(o.voucher_discount) || 0;
      const total = Number(o.total) || 0;
      const beforeDiscount = total + discount;

      totalMonthlyIncome += total;
      totalMonthlyDiscountAmount += discount;
      totalMonthlyIncomeBeforeDiscount += beforeDiscount;

      if (items.length === 0) {
        data.push({
          'Mã ĐH': o.id,
          'Email': o.user_email?.replace?.('guest_', '') ?? '',
          'Tên KH': o.name ?? '',
          'SĐT': o.phone ?? '',
          'Địa Chỉ': o.address ?? '',
          'Ngày Đặt': new Date(o.created_at).toLocaleString('vi-VN'),
          'Trạng Thái': o.status,
          'Tên Sản Phẩm': '',
          'Số Lượng': 0,
          'Đơn Giá (VND)': 0,
          'Thành Tiền (VND)': 0,
          'Mã Giảm Giá': o.voucher_code || '',
          'Giảm Giá (VND)': discount,
          'Tổng Trước Giảm (VND)': beforeDiscount,
          'Tổng Đơn KH (VND)': total
        });
      } else {
        items.forEach((item: any) => {
          const productName = item.product_name || item.name || item.product?.name || '';
          const quantity = item.quantity || 0;
          const price = item.price || 0;
          const subtotal = price * quantity;
          totalMonthlyProducts += quantity;

          data.push({
            'Mã ĐH': o.id,
            'Email': o.user_email?.replace?.('guest_', '') ?? '',
            'Tên KH': o.name ?? '',
            'SĐT': o.phone ?? '',
            'Địa Chỉ': o.address ?? '',
            'Ngày Đặt': new Date(o.created_at).toLocaleString('vi-VN'),
            'Trạng Thái': o.status,
            'Tên Sản Phẩm': productName,
            'Số Lượng': quantity,
            'Đơn Giá (VND)': price,
            'Thành Tiền (VND)': subtotal,
            'Mã Giảm Giá': o.voucher_code || '',
            'Giảm Giá (VND)': discount,
            'Tổng Trước Giảm (VND)': beforeDiscount,
            'Tổng Đơn KH (VND)': total
          });
        });
      }
    });

    // Add summary to the right side of the table
    if (data.length > 0) {
      const summaryLabels = [
        'Tổng Sản Phẩm:',
        'Tổng Giảm Giá (VND):',
        'Tổng Trước Giảm (VND):',
        'Tổng Doanh Thu (VND):'
      ];
      const summaryValues = [
        totalMonthlyProducts,
        totalMonthlyDiscountAmount,
        totalMonthlyIncomeBeforeDiscount,
        totalMonthlyIncome
      ];

      for (let i = 0; i < 4; i++) {
        if (!data[i]) data.push({} as any);
        data[i][' '] = ''; // Spacer column 
        data[i]['BÁO CÁO THÁNG'] = summaryLabels[i];
        data[i][' GIÁ TRỊ '] = summaryValues[i];
      }
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    
    // Auto-size columns
    const max_width = data.reduce((w, r) => Math.max(w, Object.keys(r).reduce((ww, k) => Math.max(ww, String(r[k]).length), 0)), 10);
    worksheet['!cols'] = Object.keys(data[0]).map(k => ({ wch: Math.max(k.length, 15) }));

    XLSX.writeFile(workbook, `don-hang-thang-${month.toString().padStart(2, '0')}-${year}.xlsx`);
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ status })
      });
      fetchOrders();
    } catch (err) {
      console.error('Failed to update order status', err);
    }
  };

  const confirmDeleteOrder = async (id: string) => {
    try {
      await fetch(`/api/admin/orders/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
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
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
          body: JSON.stringify(newProduct)
        });
      } else if (editingProduct) {
        await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
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
      await fetch(`/api/admin/products/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      refreshProducts();
      setProductToDelete(null);
    } catch (err) {
      console.error('Failed to delete product', err);
    }
  };

  const handleSaveVoucher = async () => {
    try {
      let res;
      if (isAddingVoucher) {
        const newVoucher = { ...voucherForm, id: `vouch-${Date.now()}` };
        res = await fetch('/api/admin/vouchers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
          body: JSON.stringify(newVoucher)
        });
      } else if (editingVoucher) {
        res = await fetch(`/api/admin/vouchers/${editingVoucher.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
          body: JSON.stringify(voucherForm)
        });
      }
      
      if (res && (!res.ok)) {
        const errorData = await res.json();
        alert(errorData.error || 'Có lỗi khi lưu mã giảm giá');
        return; // Prevents closing the modal so the user can fix the duplicate code
      }

      setIsAddingVoucher(false);
      setEditingVoucher(null);
      fetchVouchers();
    } catch (err) {
      console.error('Failed to save voucher', err);
      alert('Không thể kết nối đến máy chủ');
    }
  };

  const handleDeleteVoucher = (id: string) => {
    setVoucherToDelete(id);
  };

  const confirmDeleteVoucher = async (id: string) => {
    try {
      await fetch(`/api/admin/vouchers/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
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
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
          body: JSON.stringify(promotionForm)
        });
      } else if (editingPromotion) {
        await fetch(`/api/admin/promotions/${editingPromotion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
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
      await fetch(`/api/admin/promotions/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      fetchPromotions();
      setPromotionToDelete(null);
    } catch (err) {
      console.error('Failed to delete promotion', err);
    }
  };

  const handleSaveBlog = async () => {
    try {
      // Auto-generate slug if empty
      let slug = blogForm.slug;
      if (!slug && blogForm.title) {
        slug = blogForm.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }

      const formData = new FormData();
      if (isAddingBlog) {
        formData.append('id', `blog-${Date.now()}`);
      } else {
        formData.append('id', editingBlog.id);
      }
      formData.append('title', blogForm.title);
      formData.append('slug', slug);
      formData.append('excerpt', blogForm.excerpt);
      formData.append('content', blogForm.content);
      formData.append('author', blogForm.author);
      formData.append('is_published', String(blogForm.is_published));
      formData.append('is_featured', String((blogForm as any).is_featured || false));

      if (selectedBlogImage) {
        formData.append('image', selectedBlogImage);
      } else if (blogForm.image) {
        formData.append('image_url', blogForm.image); // Keep existing image if no new file
      }

      let response;
      if (isAddingBlog) {
        response = await fetch('/api/admin/blogs', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${adminToken}` },
          body: formData
        });
      } else if (editingBlog) {
        response = await fetch(`/api/admin/blogs/${editingBlog.id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${adminToken}` },
          body: formData
        });
      }

      if (response && response.ok) {
        setIsAddingBlog(false);
        setEditingBlog(null);
        setSelectedBlogImage(null);
        fetchBlogs();
      } else {
        const errorData = await response?.json();
        console.error('Failed to save blog:', errorData?.error || 'Unknown error');
        alert('Lỗi khi lưu bài viết: ' + (errorData?.error || 'Không xác định'));
      }
    } catch (err) {
      console.error('Failed to save blog', err);
      alert('Lỗi kết nối server khi lưu bài viết');
    }
  };

  const handleDeleteBlog = (id: string) => {
    setBlogToDelete(id);
  };

  const confirmDeleteBlog = async (id: string) => {
    try {
      await fetch(`/api/admin/blogs/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      fetchBlogs();
      setBlogToDelete(null);
    } catch (err) {
      console.error('Failed to delete blog', err);
    }
  };

  if (!isAdminAuth) {
    if (isAdminForgotPassword) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <ShieldCheck className="mx-auto h-12 w-12 text-teal-700" />
            <h2 className="mt-6 text-center text-3xl font-serif font-bold text-teal-900">
              Quên Mật Khẩu
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">Nhập email quản trị để nhận link khôi phục</p>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
              <form className="space-y-6" onSubmit={handleAdminForgotPassword}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Quản Trị</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSendingReset}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isSendingReset ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-800 hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500'}`}
                  >
                    {isSendingReset ? 'Đang gửi...' : 'Gửi Link Khôi Phục'}
                  </button>
                </div>
              </form>
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={() => { setIsAdminForgotPassword(false); setLoginError(''); }}
                className="text-sm font-medium text-teal-700 hover:text-teal-800"
              >
                &larr; Quay lại đăng nhập
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <ShieldCheck className="mx-auto h-12 w-12 text-teal-700" />
          <h2 className="mt-6 text-center text-3xl font-serif font-bold text-teal-900">
            Quản Trị Viên
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">Đăng nhập để vào bảng điều khiển</p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
            <form className="space-y-6" onSubmit={handleAdminLogin}>
              {loginError && (
                <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                  <button
                    type="button"
                    onClick={() => { setIsAdminForgotPassword(true); setSettingsMessage({ type: '', text: '' }); }}
                    className="text-xs font-medium text-teal-700 hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-800 hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Đăng Nhập
                </button>
              </div>
            </form>
          </div>
          <div className="mt-4 text-center">
            <button onClick={() => setView('home')} className="text-sm font-medium text-teal-700 hover:text-teal-800">
              &larr; Trở về Trang Chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif text-teal-900">Bảng Điều Khiển Quản Trị</h1>
        <div className="flex space-x-4">
          <button onClick={() => setView('home')} className="text-teal-700 hover:text-teal-900 font-medium">
            &larr; Cửa hàng
          </button>
          <button onClick={handleAdminLogout} className="text-red-600 hover:text-red-800 font-medium">
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="flex space-x-4 mb-8 border-b border-gray-200 pb-4">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'products' ? 'bg-teal-100 text-teal-900 font-bold' : 'text-gray-700 hover:bg-gray-100 font-medium'}`}
        >
          <Package size={18} />
          <span>Sản Phẩm</span>
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'collections' ? 'bg-teal-100 text-teal-900 font-bold' : 'text-gray-700 hover:bg-gray-100 font-medium'}`}
        >
          <Tag size={18} />
          <span>Dòng Sản Phẩm</span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'orders' ? 'bg-teal-100 text-teal-900 font-bold' : 'text-gray-700 hover:bg-gray-100 font-medium'}`}
        >
          <ShoppingBag size={18} />
          <span>Đơn Hàng</span>
        </button>
        <button
          onClick={() => setActiveTab('vouchers')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'vouchers' ? 'bg-teal-100 text-teal-900 font-bold' : 'text-gray-700 hover:bg-gray-100 font-medium'}`}
        >
          <Tag size={18} />
          <span>Mã Giảm Giá</span>
        </button>
        <button
          onClick={() => setActiveTab('promotions')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'promotions' ? 'bg-teal-100 text-teal-900 font-bold' : 'text-gray-700 hover:bg-gray-100 font-medium'}`}
        >
          <LayoutTemplate size={18} />
          <span>Trang Chủ</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'analytics' ? 'bg-teal-100 text-teal-900 font-bold' : 'text-gray-700 hover:bg-gray-100 font-medium'}`}
        >
          <BarChart3 size={18} />
          <span>Thống Kê Tìm Kiếm</span>
        </button>
        <button
          onClick={() => setActiveTab('blogs')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'blogs' ? 'bg-teal-100 text-teal-900 font-bold' : 'text-gray-700 hover:bg-gray-100 font-medium'}`}
        >
          <FileText size={18} />
          <span>Bài Viết</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'settings' ? 'bg-teal-100 text-teal-900 font-bold' : 'text-gray-700 hover:bg-gray-100 font-medium'}`}
        >
          <Settings size={18} />
          <span>Cài Đặt</span>
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
                setProductForm({ name: '', name_en: '', description: '', description_en: '', price: 0, category: existingCategories[0] || 'Chủng tầm trung', collection: existingCollections[0] || 'Nếp băng chủng', image: '', images: [], isNew: false, isPremium: false, isBestSeller: false });
                setIsAddingNewCategory(false);
                setIsAddingNewCollection(false);
              }}
              className="flex items-center space-x-2 bg-teal-800 text-white px-4 py-2 rounded-md hover:bg-teal-900 transition-colors font-medium shadow-sm"
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
                className="pl-10 w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter size={18} className="text-gray-500" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              >
                <option value="">{t('col.filter.all')}</option>
                <option value="Chủng tầm trung">{t('category.midRange')}</option>
                <option value="Chủng tầm cao">{t('category.highEnd')}</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={filterCollection}
                onChange={(e) => setFilterCollection(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              >
                <option value="">Tất cả dòng</option>
                {dbCollections.map(col => (
                  <option key={col.id} value={col.name}>
                    {col.name}{col.name_en ? ` (${col.name_en})` : ''}
                  </option>
                ))}
                {existingCollections.filter(ec => !dbCollections.some(c => c.name === ec)).map(ec => (
                  <option key={ec} value={ec}>{ec}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={filterFeature}
                onChange={(e) => setFilterFeature(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              >
                <option value="">Tất cả đặc điểm</option>
                <option value="new">Hàng Mới Về</option>
                <option value="bestseller">Bán Chạy Nhất</option>
                <option value="premium">Cao Cấp</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <ArrowUpDown size={18} className="text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
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
                  <h3 className="text-xl font-bold text-teal-900">{isAddingProduct ? 'Thêm Sản Phẩm Mới' : 'Chỉnh Sửa Sản Phẩm'}</h3>
                  <button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-800 mb-1">Tên (Tiếng Việt)</label>
                    <input type="text" value={productForm.name || ''} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-bold text-gray-800">Tên (Tiếng Anh)</label>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!productForm.name) return;
                          try {
                            const res = await fetch('/api/admin/translate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ text: productForm.name })
                            });
                            const data = await res.json();
                            if (data.translatedText) setProductForm(prev => ({ ...prev, name_en: data.translatedText }));
                          } catch (err) { console.error('Translation failed', err); }
                        }}
                        className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">translate</span>
                        Tự động dịch
                      </button>
                    </div>
                    <input type="text" value={productForm.name_en || ''} onChange={e => setProductForm({ ...productForm, name_en: e.target.value })} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none shadow-inner bg-gray-50" placeholder="English name..." />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Giá (VND)</label>
                    <input type="number" value={productForm.price || 0} onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Số Lượng</label>
                    <input type="number" value={productForm.amount !== undefined ? productForm.amount : 1} onChange={e => setProductForm({ ...productForm, amount: Number(e.target.value) })} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" min="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Loại Sản Phẩm</label>
                    <select value={productForm.category || ''} onChange={e => setProductForm({ ...productForm, category: e.target.value })} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none">
                      <option value="Chủng tầm trung">{t('category.midRange')}</option>
                      <option value="Chủng tầm cao">{t('category.highEnd')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Dòng Sản Phẩm</label>
                    <div className="flex gap-2">
                      <select
                        value={productForm.collection || ''}
                        onChange={e => setProductForm({ ...productForm, collection: e.target.value })}
                        className="flex-1 border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      >
                        <option value="">Chọn dòng sản phẩm...</option>
                        {dbCollections.map(col => (
                          <option key={col.id} value={col.name}>
                            {col.name}{col.name_en ? ` (${col.name_en})` : ''}
                          </option>
                        ))}
                        {/* Fallback: show any product collections not yet in the managed table */}
                        {existingCollections.filter(ec => !dbCollections.some(c => c.name === ec)).map(ec => (
                          <option key={ec} value={ec}>{ec}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        title="Quản lý dòng sản phẩm"
                        onClick={() => {
                          setIsAddingProduct(false);
                          setEditingProduct(null);
                          setActiveTab('collections');
                        }}
                        className="bg-teal-50 text-teal-700 p-2 rounded-md hover:bg-teal-100 transition-colors border border-teal-200 flex-shrink-0"
                      >
                        <Settings size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-800 mb-1">Hình Ảnh</label>
                    <div
                      className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${isDragging ? 'border-teal-500 bg-teal-50' : 'border-gray-300 bg-white'}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="space-y-1 text-center">
                        <svg className={`mx-auto h-12 w-12 ${isDragging ? 'text-teal-500' : 'text-gray-400'}`} stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500">
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
                    <label className="block text-sm font-bold text-gray-800 mb-1">Mô tả (Tiếng Việt)</label>
                    <textarea value={productForm.description || ''} onChange={e => setProductForm({ ...productForm, description: e.target.value })} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none h-24" />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-bold text-gray-800">Mô tả (Tiếng Anh)</label>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!productForm.description) return;
                          try {
                            const res = await fetch('/api/admin/translate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ text: productForm.description })
                            });
                            const data = await res.json();
                            if (data.translatedText) setProductForm(prev => ({ ...prev, description_en: data.translatedText }));
                          } catch (err) { console.error('Translation failed', err); }
                        }}
                        className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">translate</span>
                        Tự động dịch
                      </button>
                    </div>
                    <textarea value={productForm.description_en || ''} onChange={e => setProductForm({ ...productForm, description_en: e.target.value })} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none shadow-inner bg-gray-50 h-24" placeholder="English description..." />
                  </div>
                  <div className="flex items-center space-x-4 mt-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={productForm.isNew || false} onChange={e => setProductForm({ ...productForm, isNew: e.target.checked })} className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4" />
                      <span className="text-sm font-semibold text-gray-800">Hàng Mới Về</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={productForm.isPremium || false} onChange={e => setProductForm({ ...productForm, isPremium: e.target.checked })} className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4" />
                      <span className="text-sm font-semibold text-gray-800">Cao Cấp</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={productForm.isBestSeller || false} onChange={e => setProductForm({ ...productForm, isBestSeller: e.target.checked })} className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4" />
                      <span className="text-sm font-semibold text-gray-800">Bán Chạy Nhất</span>
                    </label>
                  </div>
                </div>
                <div className="mt-8 flex justify-end space-x-3 border-t pt-4">
                  <button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">Hủy</button>
                  <button onClick={handleSaveProduct} className="px-4 py-2 bg-teal-800 text-white rounded-md hover:bg-teal-900 font-medium">Lưu Sản Phẩm</button>
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
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Số Lượng</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      {product.collection}
                      {product.collection_en && <div className="text-xs text-gray-500 italic">{product.collection_en}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-teal-900">{product.price.toLocaleString('vi-VN')} VND</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.amount === 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {product.amount !== undefined ? product.amount : 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setProductForm({
                            ...product,
                            images: product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : [])
                          });
                          setIsAddingProduct(false);
                          if (!existingCategories.includes(product.category) && product.category) {
                            setIsAddingNewCategory(true);
                          } else {
                            setIsAddingNewCategory(false);
                          }
                          if (!existingCollections.includes(product.collection) && product.collection) {
                            setIsAddingNewCollection(true);
                          } else {
                            setIsAddingNewCollection(false);
                          }
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

      {/* Collections Tab */}
      {activeTab === 'collections' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Quản Lý Dòng Sản Phẩm</h2>
              <p className="text-sm text-gray-500 mt-1">Quản lý tên và mô tả các dòng sản phẩm bằng cả tiếng Việt và tiếng Anh.</p>
            </div>
            <button
              onClick={() => {
                setIsAddingCollection(true);
                setEditingCollection(null);
                setCollectionForm({ name: '', name_en: '', description: '', description_en: '', slug: '' });
                setCollectionMsg({ type: '', text: '' });
              }}
              className="flex items-center space-x-2 bg-teal-800 text-white px-4 py-2 rounded-md hover:bg-teal-900 transition-colors font-medium shadow-sm"
            >
              <Plus size={18} />
              <span>Thêm Dòng Mới</span>
            </button>
          </div>

          {/* Add/Edit Modal */}
          {(isAddingCollection || editingCollection) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-teal-900">
                    {editingCollection ? 'Chỉnh Sửa Dòng Sản Phẩm' : 'Thêm Dòng Sản Phẩm Mới'}
                  </h3>
                  <button onClick={() => { setIsAddingCollection(false); setEditingCollection(null); }} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>
                {collectionMsg.text && (
                  <div className={`mb-4 p-3 rounded-md text-sm font-medium ${collectionMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {collectionMsg.text}
                  </div>
                )}
                <form onSubmit={handleSaveCollection} className="space-y-5">
                  {/* Vietnamese & English Names */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center h-6 mb-1">
                        <label className="block text-sm font-bold text-gray-800">Tên (Tiếng Việt) <span className="text-red-500">*</span></label>
                      </div>
                      <input
                        type="text"
                        value={collectionForm.name}
                        onChange={e => setCollectionForm({ ...collectionForm, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-md p-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        placeholder="VD: Nếp băng chủng"
                        required
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between h-6 mb-1">
                        <label className="block text-sm font-bold text-gray-800">Tên (Tiếng Anh)</label>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!collectionForm.name) return;
                            try {
                              const res = await fetch('/api/admin/translate', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                                body: JSON.stringify({ text: collectionForm.name, targetLang: 'en' })
                              });
                              const data = await res.json();
                              if (data.translatedText) setCollectionForm(prev => ({ ...prev, name_en: data.translatedText }));
                            } catch (error) {
                              console.error('Translation failed', error);
                            }
                          }}
                          className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
                          title="Tự động dịch sang tiếng Anh bằng Google Translate"
                        >
                          <span className="material-symbols-outlined text-xs">translate</span>
                          Tự động dịch
                        </button>
                      </div>
                      <input
                        type="text"
                        value={collectionForm.name_en}
                        onChange={e => setCollectionForm({ ...collectionForm, name_en: e.target.value })}
                        className="w-full border border-gray-300 rounded-md p-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        placeholder="VD: Ice Type Jadeite"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100">
                    <button type="button" onClick={() => { setIsAddingCollection(false); setEditingCollection(null); }} className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">Hủy</button>
                    <button type="submit" disabled={isSavingCollection} className="px-5 py-2 bg-teal-800 text-white rounded-md hover:bg-teal-900 font-medium disabled:opacity-50">
                      {isSavingCollection ? 'Đang lưu...' : 'Lưu'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {collectionToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
                <h3 className="text-xl font-bold text-red-600 mb-3">Xác Nhận Xóa</h3>
                <p className="text-gray-700 mb-6">Bạn có chắc muốn xóa dòng sản phẩm này? Các sản phẩm thuộc dòng này vẫn được giữ nguyên nhưng sẽ không còn liên kết chính thức.</p>
                <div className="flex justify-end space-x-3">
                  <button onClick={() => setCollectionToDelete(null)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">Hủy</button>
                  <button onClick={() => confirmDeleteCollection(collectionToDelete)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium">Xóa</button>
                </div>
              </div>
            </div>
          )}

          {/* Collections Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tên (VI / EN)</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dbCollections.length > 0 ? (
                  dbCollections.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{c.name}</div>
                        <div className="text-sm text-gray-500 italic">{c.name_en || <span className="text-gray-300">Chưa có bản dịch</span>}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setEditingCollection(c);
                            setIsAddingCollection(false);
                            setCollectionForm({ name: c.name, name_en: c.name_en || '', description: c.description || '', description_en: c.description_en || '', slug: c.slug || '' });
                            setCollectionMsg({ type: '', text: '' });
                          }}
                          className="text-teal-700 hover:text-teal-900 mr-3"
                          title="Chỉnh sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button onClick={() => setCollectionToDelete(c.id)} className="text-red-500 hover:text-red-700" title="Xóa">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                      Chưa có dòng sản phẩm nào. Nhấn "Thêm Dòng Mới" để bắt đầu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quản Lý Đơn Hàng</h2>
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
              <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">Xuất Excel theo tháng:</label>
              <select
                value={exportMonth.split('-')[1]}
                onChange={e => setExportMonth(`${exportMonth.split('-')[0]}-${e.target.value}`)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => (
                  <option key={m} value={m}>Tháng {parseInt(m)}</option>
                ))}
              </select>
              <select
                value={exportMonth.split('-')[0]}
                onChange={e => setExportMonth(`${e.target.value}-${exportMonth.split('-')[1]}`)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {Array.from(new Set([
                  new Date().getFullYear(),
                  ...orders.map(o => new Date(o.created_at).getFullYear())
                ])).sort((a, b) => b - a).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button
                onClick={downloadOrdersExcel}
                className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-1.5 rounded-md text-sm font-bold hover:bg-emerald-800 transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-base leading-none">description</span>
                Excel
              </button>
            </div>
          </div>

          {/* Order Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="bg-teal-100 p-3 rounded-full text-teal-800">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng sản phẩm đã bán ({exportMonth})</p>
                <p className="text-xl font-black text-gray-900">{orderStats.totalProducts}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-full text-emerald-800">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng doanh thu ({exportMonth})</p>
                <p className="text-xl font-black text-gray-900">{Number(orderStats.totalIncome).toLocaleString('vi-VN')} VND</p>
              </div>
            </div>
          </div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-teal-900">{Number(order.total).toLocaleString('vi-VN')} VND</td>
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
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Xem chi tiết đơn hàng"
                        >
                          <span className="material-symbols-outlined text-lg align-middle">visibility</span>
                        </button>
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
                <h3 className="text-lg font-bold text-teal-900 mb-4">Biên Lai Thanh Toán</h3>
                <img src={receiptToView} alt="Biên lai" className="max-w-full h-auto object-contain" />
              </div>
            </div>
          )}

          {/* View Order Details Modal */}
          {orderToView && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setOrderToView(null)}>
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-teal-900">Chi Tiết Đơn Hàng #{orderToView.id}</h3>
                  <button onClick={() => setOrderToView(null)} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Order Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Thông Tin Đơn Hàng</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mã đơn hàng:</span>
                        <span className="font-medium text-gray-900">{orderToView.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ngày đặt:</span>
                        <span className="font-medium text-gray-900">{new Date(orderToView.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trạng thái:</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                          ${orderToView.status === 'Delivered' || orderToView.status === 'Đã Giao' ? 'bg-green-100 text-green-800' :
                            orderToView.status === 'Shipped' || orderToView.status === 'Đang Giao' ? 'bg-blue-100 text-blue-800' :
                              orderToView.status === 'Processing' || orderToView.status === 'Đang Xử Lý' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'}`}>
                          {orderToView.status === 'Pending' ? 'Chờ Xử Lý' :
                            orderToView.status === 'Processing' ? 'Đang Xử Lý' :
                              orderToView.status === 'Shipped' ? 'Đang Giao' :
                                orderToView.status === 'Delivered' ? 'Đã Giao' :
                                  orderToView.status === 'Cancelled' ? 'Đã Hủy' : orderToView.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tổng tiền:</span>
                         <span className="font-bold text-teal-900">{Number(orderToView.total).toLocaleString('vi-VN')} VND</span>
                      </div>
                      {orderToView.voucher_code && (
                        <>
                          <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                            <span className="text-gray-600">Mã giảm giá áp dụng:</span>
                            <span className="font-bold text-teal-700">{orderToView.voucher_code}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Mức giảm:</span>
                            <span className="font-bold text-teal-700">
                              {orderToView.voucher_type === 'percent' 
                                ? `${orderToView.voucher_discount * 100}%` 
                                : `${Number(orderToView.voucher_discount || 0).toLocaleString('vi-VN')} VND`}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Thông Tin Khách Hàng</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-gray-900">{orderToView.user_email}</span>
                      </div>
                      {orderToView.name && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tên:</span>
                          <span className="font-medium text-gray-900">{orderToView.name}</span>
                        </div>
                      )}
                      {orderToView.phone && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Số điện thoại:</span>
                          <span className="font-medium text-gray-900">{orderToView.phone}</span>
                        </div>
                      )}
                      {orderToView.address && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Địa chỉ:</span>
                          <span className="font-medium text-gray-900">{orderToView.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Sản Phẩm Đã Đặt</h4>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Sản Phẩm</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Số Lượng</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Đơn Giá</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Tổng</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orderToView.items?.map((item: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                  <div className="text-xs text-gray-500">{item.category}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-sm text-gray-900">{Number(item.price).toLocaleString('vi-VN')} VND</td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{Number(item.price * item.quantity).toLocaleString('vi-VN')} VND</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Order Notes */}
                {orderToView.notes && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Ghi Chú</h4>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700">{orderToView.notes}</p>
                    </div>
                  </div>
                )}

                {/* Order Feedback */}
                {orderFeedback && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-teal-900 mb-2">Đánh Giá Từ Khách Hàng</h4>
                    <div className="bg-teal-50 border border-teal-100 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-500">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className="material-symbols-outlined text-lg" style={{ fontVariationSettings: `'FILL' ${star <= orderFeedback.rating ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}>
                              star
                            </span>
                          ))}
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-700">({orderFeedback.rating} Sao)</span>
                      </div>
                      <p className="text-sm text-gray-700">{orderFeedback.comment || '(Không có nhận xét)'}</p>
                      <p className="text-xs text-gray-500 mt-2">Gửi lúc: {new Date(orderFeedback.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button onClick={() => setOrderToView(null)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">
                    Đóng
                  </button>
                </div>
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
                setVoucherForm({ code: '', discount: 0, type: 'percent', is_active: true, usage_limit: '', min_user_spending: 0, min_order_value: 0, max_discount_amount: '', is_hidden: false, is_registration: false });
              }}
              className="flex items-center space-x-2 bg-teal-800 text-white px-4 py-2 rounded-md hover:bg-teal-900 transition-colors font-medium shadow-sm"
            >
              <Plus size={18} />
              <span>Thêm Mã Giảm Giá</span>
            </button>
          </div>

          {(isAddingVoucher || editingVoucher) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-teal-900">{isAddingVoucher ? 'Thêm Mã Giảm Giá Mới' : 'Chỉnh Sửa Mã Giảm Giá'}</h3>
                  <button onClick={() => { setIsAddingVoucher(false); setEditingVoucher(null); }} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Mã</label>
                    <input type="text" value={voucherForm.code} onChange={e => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })} className="w-full border border-gray-300 rounded-md p-2 uppercase text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Mức Giảm Giá {voucherForm.type === 'percent' ? '(%)' : '(VND)'}</label>
                    <input type="number"
                      value={voucherForm.type === 'percent' ? (Number(voucherForm.discount) * 100) : voucherForm.discount}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setVoucherForm({ ...voucherForm, discount: voucherForm.type === 'percent' ? val / 100 : val });
                      }}
                      className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none no-spinner" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Loại</label>
                    <select value={voucherForm.type} onChange={e => {
                      const newType = e.target.value;
                      // Convert discount if switching types to prevent wild values
                      let newDiscount = voucherForm.discount;
                      if (voucherForm.type === 'fixed' && newType === 'percent') {
                        newDiscount = Math.min(newDiscount / 100, 1); // Cap at 100% (1.0)
                      } else if (voucherForm.type === 'percent' && newType === 'fixed') {
                        newDiscount = newDiscount * 100;
                      }
                      setVoucherForm({ ...voucherForm, type: newType, discount: newDiscount });
                    }} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none">
                      <option value="percent">Phần Trăm (%)</option>
                      <option value="fixed">Số Tiền Cố Định (VND)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Giới Hạn Lượt Dùng Toàn Cục (Trống = vô hạn)</label>
                    <input type="number" value={voucherForm.usage_limit || ''} onChange={e => setVoucherForm({ ...voucherForm, usage_limit: e.target.value ? Number(e.target.value) : '' })} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none no-spinner" placeholder="VD: 100" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Cấp Độ Khách Hàng Tối Thiểu Được Dùng</label>
                    <select value={voucherForm.min_user_spending || 0} onChange={e => setVoucherForm({ ...voucherForm, min_user_spending: Number(e.target.value) })} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none">
                      <option value={0}>Tất cả khách hàng</option>
                      <option value={50000000}>Đậu Chủng (Từ 50.000.000 VND)</option>
                      <option value={300000000}>Nếp Chủng (Từ 300.000.000 VND)</option>
                      <option value={1000000000}>Băng Chủng (Từ 1.000.000.000 VND)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Giá Trị Đơn Hàng Tối Thiểu (VND)</label>
                    <input type="number" value={voucherForm.min_order_value || 0} onChange={e => setVoucherForm({ ...voucherForm, min_order_value: Number(e.target.value) })} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none no-spinner" min="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Số Tiền Giảm Tối Đa (Trống = Không giới hạn)</label>
                    <input type="number" value={voucherForm.max_discount_amount || ''} onChange={e => setVoucherForm({ ...voucherForm, max_discount_amount: e.target.value ? Number(e.target.value) : '' })} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none no-spinner" min="0" />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={voucherForm.is_active} onChange={e => setVoucherForm({ ...voucherForm, is_active: e.target.checked })} className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4" />
                      <span className="text-sm font-semibold text-gray-800">Hoạt Động</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={voucherForm.is_hidden} onChange={e => setVoucherForm({ ...voucherForm, is_hidden: e.target.checked })} className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4" />
                      <span className="text-sm font-semibold text-gray-800">Ẩn (Không hiện ở Profile/Giỏ hàng)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={voucherForm.is_registration} onChange={e => setVoucherForm({ ...voucherForm, is_registration: e.target.checked })} className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4" />
                      <span className="text-sm font-semibold text-gray-800">Tặng Khi Đăng Ký (Chào Mừng)</span>
                    </label>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button onClick={() => { setIsAddingVoucher(false); setEditingVoucher(null); }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">Hủy</button>
                  <button onClick={handleSaveVoucher} className="px-4 py-2 bg-teal-800 text-white rounded-md hover:bg-teal-900 font-medium">Lưu Mã Giảm Giá</button>
                </div>
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
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Lượt Dùng</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Cấp Độ / Đơn T.Thiểu</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Giảm Tối Đa</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Trạng Thái</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Hành Động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vouchers.map(voucher => (
                  <tr key={voucher.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{voucher.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      {voucher.type === 'percent' ? `${voucher.discount * 100}%` : `${Number(voucher.discount).toLocaleString('vi-VN')} VND`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      {voucher.usage_count} / {voucher.usage_limit || '∞'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs">{voucher.min_user_spending === 1000000000 ? 'Băng Chủng' : voucher.min_user_spending === 300000000 ? 'Nếp Chủng' : voucher.min_user_spending === 50000000 ? 'Đậu Chủng' : 'Tất cả khách'}</span>
                        <span className="text-xs text-teal-700 font-bold">{voucher.min_order_value ? `Đơn > ${Number(voucher.min_order_value).toLocaleString('vi-VN')}₫` : 'Không giới hạn đơn'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      {voucher.max_discount_amount ? `${Number(voucher.max_discount_amount).toLocaleString('vi-VN')}₫` : '∞'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex flex-col items-start gap-1">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${voucher.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {voucher.is_active ? 'Hoạt Động' : 'Không Hoạt Động'}
                      </span>
                      {voucher.is_hidden ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-600">
                          Đã Ẩn
                        </span>
                      ) : null}
                      {voucher.is_registration ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-teal-100 text-teal-700">
                          Chào Mừng
                        </span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingVoucher(voucher);
                          setVoucherForm({
                            ...voucher,
                            usage_limit: voucher.usage_limit || '',
                            min_user_spending: voucher.min_user_spending || 0,
                            min_order_value: voucher.min_order_value || 0,
                            max_discount_amount: voucher.max_discount_amount || '',
                            is_hidden: voucher.is_hidden || false,
                            is_registration: voucher.is_registration || false
                          });
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
                setPromotionForm({ title: '', title_en: '', subtitle: '', subtitle_en: '', image: '', cta: '', cta_en: '', order_index: 0 });
              }}
              className="flex items-center space-x-2 bg-teal-800 text-white px-4 py-2 rounded-md hover:bg-teal-900 transition-colors font-medium shadow-sm"
            >
              <Plus size={18} />
              <span>Thêm Khuyến Mãi</span>
            </button>
          </div>

          {(isAddingPromotion || editingPromotion) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-teal-900">{isAddingPromotion ? 'Thêm Khuyến Mãi Mới' : 'Chỉnh Sửa Khuyến Mãi'}</h3>
                  <button onClick={() => { setIsAddingPromotion(false); setEditingPromotion(null); }} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-800 mb-1">Tiêu Đề (Tiếng Việt)</label>
                    <input type="text" value={promotionForm.title} onChange={e => setPromotionForm({ ...promotionForm, title: e.target.value })} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-bold text-gray-800">Tiêu Đề (Tiếng Anh)</label>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!promotionForm.title) return;
                          try {
                            const res = await fetch('/api/admin/translate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ text: promotionForm.title })
                            });
                            const data = await res.json();
                            if (data.translatedText) setPromotionForm(prev => ({ ...prev, title_en: data.translatedText }));
                          } catch (err) { console.error('Translation failed', err); }
                        }}
                        className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">translate</span>
                        Tự động dịch
                      </button>
                    </div>
                    <input type="text" value={promotionForm.title_en || ''} onChange={e => setPromotionForm({ ...promotionForm, title_en: e.target.value })} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-gray-50 h-10" placeholder="English title..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-800 mb-1">Tiêu Đề Phụ (Tiếng Việt)</label>
                    <input type="text" value={promotionForm.subtitle} onChange={e => setPromotionForm({ ...promotionForm, subtitle: e.target.value })} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-bold text-gray-800">Tiêu Đề Phụ (Tiếng Anh)</label>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!promotionForm.subtitle) return;
                          try {
                            const res = await fetch('/api/admin/translate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ text: promotionForm.subtitle })
                            });
                            const data = await res.json();
                            if (data.translatedText) setPromotionForm(prev => ({ ...prev, subtitle_en: data.translatedText }));
                          } catch (err) { console.error('Translation failed', err); }
                        }}
                        className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">translate</span>
                        Tự động dịch
                      </button>
                    </div>
                    <input type="text" value={promotionForm.subtitle_en || ''} onChange={e => setPromotionForm({ ...promotionForm, subtitle_en: e.target.value })} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-gray-50 h-10" placeholder="English subtitle..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-800 mb-1">Hình Ảnh</label>
                    <div
                      className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${isDragging ? 'border-teal-500 bg-teal-50' : 'border-gray-300 bg-white'}`}
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
                        <svg className={`mx-auto h-12 w-12 ${isDragging ? 'text-teal-500' : 'text-gray-400'}`} stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label htmlFor="promo-file-upload" className="relative cursor-pointer rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500">
                            <span>Tải ảnh lên</span>
                            <input id="promo-file-upload" name="promo-file-upload" type="file" className="hidden" accept="image/*" onChange={(e) => {
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
                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">Nút CTA (VN)</label>
                        <input type="text" value={promotionForm.cta} onChange={e => setPromotionForm({ ...promotionForm, cta: e.target.value })} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-sm font-bold text-gray-800">Nút CTA (EN)</label>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!promotionForm.cta) return;
                              try {
                                const res = await fetch('/api/admin/translate', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ text: promotionForm.cta })
                                });
                                const data = await res.json();
                                if (data.translatedText) setPromotionForm(prev => ({ ...prev, cta_en: data.translatedText }));
                              } catch (err) { console.error('Translation failed', err); }
                            }}
                            className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">translate</span>
                            Dịch
                          </button>
                        </div>
                        <input type="text" value={promotionForm.cta_en || ''} onChange={e => setPromotionForm({ ...promotionForm, cta_en: e.target.value })} className="w-full border border-gray-300 rounded-md p-2 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-gray-50 h-10" placeholder="CTA label EN..." />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex justify-end space-x-3 border-t pt-4">
                  <button onClick={() => { setIsAddingPromotion(false); setEditingPromotion(null); }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">Hủy</button>
                  <button onClick={handleSavePromotion} className="px-4 py-2 bg-teal-800 text-white rounded-md hover:bg-teal-900 font-medium">Lưu Khuyến Mãi</button>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{promo.title}</div>
                      {promo.title_en && <div className="text-xs text-gray-500 italic">{promo.title_en}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingPromotion(promo);
                          setPromotionForm({
                            ...promo,
                            title_en: promo.title_en || '',
                            subtitle_en: promo.subtitle_en || '',
                            cta_en: promo.cta_en || ''
                          });
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

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Thống Kê Từ Khóa Tìm Kiếm</h2>
            <div className="flex space-x-2">
              <button
                onClick={clearAnalytics}
                className="bg-red-50 text-red-600 px-4 py-2 rounded-md hover:bg-red-100 transition-colors font-medium text-sm border border-red-200"
              >
                Xóa Dữ Liệu
              </button>
              <button
                onClick={fetchAnalytics}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Làm Mới
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            {searchAnalytics.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Chưa có dữ liệu tìm kiếm nào.</div>
            ) : (
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={searchAnalytics}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fill: '#4b5563', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#4b5563', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#f3f4f6' }}
                    />
                    <Legend />
                    <Bar dataKey="count" name="Số lượt tìm kiếm" fill="#064e3b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Blogs Tab */}
      {activeTab === 'blogs' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quản Lý Bài Viết</h2>
            <button
              onClick={() => {
                setIsAddingBlog(true);
                setEditingBlog(null);
                setBlogForm({ title: '', slug: '', excerpt: '', content: '', author: 'Admin', is_published: false, is_featured: false, image: '' });
                setSelectedBlogImage(null);
              }}
              className="flex items-center space-x-2 bg-teal-800 text-white px-4 py-2 rounded-md hover:bg-teal-900 transition-colors font-medium shadow-sm"
            >
              <Plus size={18} />
              <span>Thêm Bài Viết</span>
            </button>
          </div>

          {(isAddingBlog || editingBlog) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mt-10 mb-10">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <h3 className="text-2xl font-bold text-teal-900">{isAddingBlog ? 'Thêm Bài Viết Mới' : 'Sửa Bài Viết'}</h3>
                  <button onClick={() => { setIsAddingBlog(false); setEditingBlog(null); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-800 mb-2">Hình ảnh bài viết</label>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                        {selectedBlogImage ? (
                          <img src={URL.createObjectURL(selectedBlogImage)} alt="Preview" className="w-full h-full object-cover" />
                        ) : blogForm.image ? (
                          <img src={blogForm.image} alt="Current" className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="text-gray-400" size={24} />
                        )}
                      </div>
                      <div className="flex flex-col space-y-2">
                        <label className="bg-white border border-teal-600 text-teal-700 px-4 py-2 rounded-md cursor-pointer hover:bg-teal-50 transition-colors text-sm font-bold flex items-center">
                          <Plus size={16} className="mr-2" />
                          Chọn Ảnh
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setSelectedBlogImage(e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                        <p className="text-xs text-gray-500">Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB.</p>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-800 mb-2">Tiêu đề bài viết</label>
                    <input type="text" value={blogForm.title} onChange={e => setBlogForm({ ...blogForm, title: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">URL Slug (Tùy chọn)</label>
                    <input type="text" value={blogForm.slug} onChange={e => setBlogForm({ ...blogForm, slug: e.target.value })} placeholder="tu-dong-tao-neu-de-trong" className="w-full border border-gray-300 rounded-lg p-3 text-gray-500 focus:ring-2 focus:ring-teal-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">Tác giả</label>
                    <input type="text" value={blogForm.author} onChange={e => setBlogForm({ ...blogForm, author: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-teal-500 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-800 mb-2">Đoạn trích (Excerpt)</label>
                    <textarea value={blogForm.excerpt} onChange={e => setBlogForm({ ...blogForm, excerpt: e.target.value })} rows={3} className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-teal-500 outline-none"></textarea>
                  </div>
                  <div className="md:col-span-2 mb-12">
                    <label className="block text-sm font-bold text-gray-800 mb-2">Nội dung bài viết (Rich Text)</label>
                    <div className="bg-white" style={{ minHeight: '400px' }}>
                      <ReactQuill 
                        theme="snow" 
                        value={blogForm.content} 
                        onChange={(content) => setBlogForm({ ...blogForm, content })} 
                        style={{ height: '350px' }}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-center">
                    <input type="checkbox" id="is_published" checked={blogForm.is_published} onChange={e => setBlogForm({ ...blogForm, is_published: e.target.checked })} className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500 mr-3" />
                    <label htmlFor="is_published" className="text-gray-800 font-bold select-none cursor-pointer">Xuất bản bài viết này (Hiển thị công khai)</label>
                  </div>
                  <div className="md:col-span-2 flex items-center">
                    <input type="checkbox" id="is_featured" checked={(blogForm as any).is_featured || false} onChange={e => setBlogForm({ ...blogForm, is_featured: e.target.checked } as any)} className="w-5 h-5 text-amber-500 border-gray-300 rounded focus:ring-amber-500 mr-3" />
                    <label htmlFor="is_featured" className="text-gray-800 font-bold select-none cursor-pointer flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500 text-xl">star</span>
                      Hiển thị trên Trang Chủ (tối đa 3 bài)
                    </label>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                  <button onClick={() => { setIsAddingBlog(false); setEditingBlog(null); }} className="px-6 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors">Hủy</button>
                  <button onClick={handleSaveBlog} className="px-6 py-2.5 bg-teal-800 text-white rounded-md hover:bg-teal-900 font-medium transition-colors shadow-sm flex items-center">
                    <Check size={18} className="mr-2" />
                    Lưu Bài Viết
                  </button>
                </div>
              </div>
            </div>
          )}

          {blogToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-xl font-bold text-red-600 mb-4">Xác Nhận Xóa</h3>
                <p className="text-gray-700 mb-6">Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.</p>
                <div className="flex justify-end space-x-3">
                  <button onClick={() => setBlogToDelete(null)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">Hủy</button>
                  <button onClick={() => confirmDeleteBlog(blogToDelete)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium">Xóa</button>
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
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Trạng Thái</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Trang Chủ</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ngày Tạo</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Hành Động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {blogs.map(blog => (
                  <tr key={blog.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-16 h-10 bg-gray-100 rounded overflow-hidden border border-gray-200">
                        {blog.image ? (
                          <img src={blog.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText size={14} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 max-w-xs truncate">{blog.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${blog.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {blog.is_published ? 'Đã xuất bản' : 'Bản nháp'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {blog.is_featured ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                          <span className="material-symbols-outlined text-xs">star</span>
                          Trang chủ
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(blog.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingBlog(blog);
                          setBlogForm({
                            title: blog.title || '',
                            slug: blog.slug || '',
                            excerpt: blog.excerpt || '',
                            content: blog.content || '',
                            author: blog.author || 'Admin',
                            is_published: blog.is_published,
                            is_featured: blog.is_featured,
                            image: blog.image || ''
                          } as any);
                          setSelectedBlogImage(null);
                          setIsAddingBlog(false);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteBlog(blog.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {blogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Chưa có bài viết nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="w-full mt-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Account Settings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="text-teal-700" size={24} />
              Cài Đặt Tài Khoản
            </h2>
            <form onSubmit={handleSaveSettings} className="space-y-6">

              <div>
                <label className="block text-sm font-medium text-gray-700">Email Đăng Nhập</label>
                <input type="email" value={settingEmail} onChange={e => setSettingEmail(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mật khẩu hiện tại (để thay đổi thông tin)</label>
                <input type="password" value={settingCurrentPassword} onChange={e => setSettingCurrentPassword(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mật khẩu mới (ít nhất 8 ký tự, có chữ hoa & số)</label>
                <input type="password" value={settingNewPassword} onChange={e => setSettingNewPassword(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" />
              </div>
              <div className="pt-4 border-t border-gray-200">
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-800 hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors">
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>

          {/* Admin Management */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ShieldCheck className="text-teal-700" size={24} />
              Quản Lý Tài Khoản Quản Trị
            </h2>

            <div className="flex-1 mb-8 overflow-y-auto max-h-[300px] border border-gray-100 rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allAdmins.map(admin => (
                    <tr key={admin.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{admin.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{admin.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                          className="text-red-600 hover:text-red-900 transition-colors p-1"
                          title="Xóa quản trị viên"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-teal-900 mb-4">Thêm Quản Trị Viên Mới</h3>
              <form onSubmit={handleCreateAdmin} className="space-y-4">

                <div>
                  <input
                    type="email"
                    placeholder="Email mới"
                    value={newAdminEmail}
                    onChange={e => setNewAdminEmail(e.target.value)}
                    required
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Mật khẩu mới (ít nhất 8 ký tự, có chữ hoa & số)"
                    value={newAdminPassword}
                    onChange={e => setNewAdminPassword(e.target.value)}
                    required
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                  />
                </div>
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-800 hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors">
                  Tạo Tài Khoản
                </button>
              </form>
            </div>
          </div>

          {/* Bank Settings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Settings className="text-teal-700" size={24} />
              Thông Tin Thanh Toán (QR Chuyển Khoản)
            </h2>
            <p className="text-sm text-gray-500 mb-6">Thông tin này hiển thị ở trang thanh toán để khách hàng chuyển khoản trực tiếp khi mua hàng.</p>

            <form onSubmit={handleSaveBankSettings} className="space-y-6">
              {bankSettingsMessage.text && (
                <div className={`p-4 rounded-md text-sm ${bankSettingsMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {bankSettingsMessage.text}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Ngân Hàng</label>
                <input type="text" value={bankSettings.bankName} onChange={e => setBankSettings({ ...bankSettings, bankName: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chủ Tài Khoản</label>
                <input type="text" value={bankSettings.bankOwner} onChange={e => setBankSettings({ ...bankSettings, bankOwner: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số Tài Khoản</label>
                <input type="text" value={bankSettings.bankNumber} onChange={e => setBankSettings({ ...bankSettings, bankNumber: e.target.value })} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 font-mono" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mã QR Thanh Toán</label>
                <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="w-32 h-32 bg-white border border-gray-200 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0">
                    {qrPreview ? (
                      <img src={qrPreview} alt="Bank QR" className="w-full h-full object-contain" />
                    ) : (
                      <span className="material-symbols-outlined text-gray-300 text-4xl">qr_code_2</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs text-gray-500 mb-2">Tải lên hình ảnh mã QR (JPG, PNG). Hình ảnh này sẽ được hiển thị ở bước thanh toán.</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setQrFile(file);
                          setQrPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={isSavingBankSettings} className="bg-teal-800 text-white px-6 py-2 rounded-md hover:bg-teal-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium">
                  {isSavingBankSettings && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>

          {/* Contact Settings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-700 text-2xl">contact_page</span>
              Thông Tin Liên Hệ
            </h2>
            <p className="text-sm text-gray-500 mb-6">Cập nhật thông tin liên hệ hiển thị ở trang Liên Hệ.</p>

            <form onSubmit={handleSaveContactSettings} className="space-y-6">
              {contactSettingsMessage.text && (
                <div className={`p-4 rounded-md text-sm ${contactSettingsMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {contactSettingsMessage.text}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                <input type="text" placeholder="Ví dụ: 123 Nguyễn Huệ, Quận 1..." value={contactSettings.address} onChange={e => setContactSettings({ ...contactSettings, address: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Điện thoại</label>
                <input type="text" placeholder="Ví dụ: 0901 234 567" value={contactSettings.phone} onChange={e => setContactSettings({ ...contactSettings, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" placeholder="Ví dụ: contact@phithuylecong.vn" value={contactSettings.email} onChange={e => setContactSettings({ ...contactSettings, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ làm việc</label>
                <input type="text" placeholder="Ví dụ: Thứ 2 – Thứ 7: 8:00 – 18:00" value={contactSettings.workingHours} onChange={e => setContactSettings({ ...contactSettings, workingHours: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500" />
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={isSavingContactSettings} className="bg-teal-800 text-white px-6 py-2 rounded-md hover:bg-teal-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium">
                  {isSavingContactSettings && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>

          {/* Social Links Settings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-700 text-2xl">share</span>
              Liên Kết Mạng Xã Hội
            </h2>
            <p className="text-sm text-gray-500 mb-6">Cập nhật các đường link mạng xã hội để hiển thị ở footer trang web.</p>

            <form onSubmit={handleSaveSocialSettings} className="space-y-6">
              {socialSettingsMessage.text && (
                <div className={`p-4 rounded-md text-sm ${socialSettingsMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {socialSettingsMessage.text}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                <input type="url" placeholder="https://facebook.com/..." value={socialSettings.facebook} onChange={e => setSocialSettings({ ...socialSettings, facebook: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TikTok</label>
                <input type="url" placeholder="https://tiktok.com/@..." value={socialSettings.tiktok} onChange={e => setSocialSettings({ ...socialSettings, tiktok: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                <input type="url" placeholder="https://instagram.com/..." value={socialSettings.instagram} onChange={e => setSocialSettings({ ...socialSettings, instagram: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telegram</label>
                <input type="url" placeholder="https://t.me/..." value={socialSettings.telegram} onChange={e => setSocialSettings({ ...socialSettings, telegram: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zalo (Số điện thoại)</label>
                <input type="text" placeholder="VD: 09..." value={socialSettings.zalo} onChange={e => setSocialSettings({ ...socialSettings, zalo: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500" />
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={isSavingSocialSettings} className="bg-teal-800 text-white px-6 py-2 rounded-md hover:bg-teal-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium">
                  {isSavingSocialSettings && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
