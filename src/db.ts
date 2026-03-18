import Database from 'better-sqlite3';
import { Product } from './types';

import bcrypt from 'bcryptjs';

const db = new Database('jade_elegance.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT,
    collection TEXT,
    image TEXT,
    images TEXT,
    isNew INTEGER DEFAULT 0,
    isPremium INTEGER DEFAULT 0,
    isBestSeller INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    name TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    total REAL,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT,
    product_id TEXT,
    quantity INTEGER,
    price REAL,
    FOREIGN KEY(order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS vouchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    discount REAL NOT NULL,
    type TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    usage_limit INTEGER DEFAULT NULL,
    usage_count INTEGER DEFAULT 0,
    min_user_spending REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS used_vouchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    voucher_code TEXT NOT NULL,
    order_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_email, voucher_code)
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    image TEXT NOT NULL,
    cta TEXT NOT NULL,
    order_index INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS search_keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL,
    normalized_keyword TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS blogs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT,
    image TEXT,
    author TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_published INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS email_verifications (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at DATETIME NOT NULL
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    email TEXT PRIMARY KEY,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL
  );

  CREATE TABLE IF NOT EXISTS order_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(order_id) REFERENCES orders(id)
  );

  DROP TABLE IF EXISTS admins;
  CREATE TABLE admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Seed default admin if none exists
const checkAdmin = db.prepare('SELECT count(*) as count FROM admins').get() as { count: number };
if (checkAdmin.count === 0) {
  const defaultHash = bcrypt.hashSync('admin', 10);
  db.prepare('INSERT INTO admins (email, password) VALUES (?, ?)').run('cpuram0001@gmail.com', defaultHash);
}

try {
  db.exec('ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0;');
} catch (e) {
  // Column already exists
}

try {
  db.exec('ALTER TABLE products ADD COLUMN images TEXT;');
} catch (e) {
  // Column already exists
}

try {
  db.exec('ALTER TABLE orders ADD COLUMN name TEXT;');
  db.exec('ALTER TABLE orders ADD COLUMN phone TEXT;');
  db.exec('ALTER TABLE orders ADD COLUMN address TEXT;');
} catch (e) {
  // Columns already exist
}

try {
  db.exec('ALTER TABLE orders ADD COLUMN notes TEXT;');
} catch (e) {
  // Column already exists
}

try {
  db.exec('ALTER TABLE orders ADD COLUMN receipt TEXT;');
} catch (e) {
  // Column already exists
}

try {
  db.exec('ALTER TABLE vouchers ADD COLUMN usage_limit INTEGER DEFAULT NULL;');
  db.exec('ALTER TABLE vouchers ADD COLUMN usage_count INTEGER DEFAULT 0;');
  db.exec('ALTER TABLE vouchers ADD COLUMN min_user_spending REAL DEFAULT 0;');
} catch (e) {
  // Columns already exist
}

try {
  db.exec('ALTER TABLE blogs ADD COLUMN is_featured INTEGER DEFAULT 0;');
} catch (e) {
  // Column already exists
}

export function seedProducts(products: Product[]) {
  const check = db.prepare('SELECT count(*) as count FROM products').get() as { count: number };
  if (check.count === 0) {
    const insert = db.prepare(`
      INSERT INTO products (id, name, description, price, category, collection, image, images, isNew, isPremium, isBestSeller)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((items: Product[]) => {
      for (const item of items) {
        insert.run(
          item.id,
          item.name,
          item.description,
          item.price,
          item.category,
          item.collection,
          item.image,
          JSON.stringify(item.images || [item.image]),
          item.isNew ? 1 : 0,
          item.isPremium ? 1 : 0,
          item.isBestSeller ? 1 : 0
        );
      }
    });

    insertMany(products);
    console.log('Database seeded with initial products.');
  }

  const checkVouchers = db.prepare('SELECT count(*) as count FROM vouchers').get() as { count: number };
  if (checkVouchers.count === 0) {
    const insertVoucher = db.prepare('INSERT INTO vouchers (id, code, discount, type, is_active, usage_limit, usage_count, min_user_spending) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertVoucher.run('vouch-1', 'DISCOUNT10', 0.1, 'percent', 1, null, 0, 0);
    insertVoucher.run('vouch-2', 'MINUS500', 500, 'fixed', 1, 100, 0, 5000);
    console.log('Database seeded with initial vouchers.');
  }

  // Seed default social links
  const socialConfig = [
    { key: 'social_facebook', value: 'https://facebook.com/' },
    { key: 'social_tiktok', value: 'https://tiktok.com/' },
    { key: 'social_instagram', value: 'https://instagram.com/' },
    { key: 'social_telegram', value: 'https://telegram.org/' }
  ];
  const checkSocialSetting = db.prepare("SELECT count(*) as count FROM settings WHERE key LIKE 'social_%'").get() as { count: number };
  if (checkSocialSetting.count === 0) {
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    socialConfig.forEach(config => insertSetting.run(config.key, config.value));
    console.log('Database seeded with initial social links.');
  }

  const checkUsers = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (checkUsers.count === 0) {
    const insertUser = db.prepare('INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)');
    const hash = bcrypt.hashSync('admin123', 10);
    insertUser.run('admin-1', 'admin@jade.com', hash, 'Admin User');
    console.log('Database seeded with admin user.');
  }

  const checkPromotions = db.prepare('SELECT count(*) as count FROM promotions').get() as { count: number };
  if (checkPromotions.count === 0) {
    const insertPromo = db.prepare('INSERT INTO promotions (title, subtitle, image, cta, order_index) VALUES (?, ?, ?, ?, ?)');
    insertPromo.run("Khuyến Mãi Tết Nguyên Đán", "Giảm giá lên đến 20% cho Bộ Sưu Tập Lục Bảo Hoàng Gia", "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?q=80&w=1920&auto=format&fit=crop", "Mua Ngay", 0);
    insertPromo.run("Giấc Mơ Sắc Tím", "Sản Phẩm Mới: Phỉ Thúy Tím Chạm Khắc Thủ Công", "https://images.unsplash.com/photo-1588444839799-eb642997a34f?q=80&w=1920&auto=format&fit=crop", "Khám Phá", 1);
    insertPromo.run("Di Sản Thủ Công", "Khám phá bí mật của Ngọc Phỉ Thúy Myanmar", "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?q=80&w=1920&auto=format&fit=crop", "Tìm Hiểu Thêm", 2);
    console.log('Database seeded with initial promotions.');
  }

  const checkOrders = db.prepare('SELECT count(*) as count FROM orders').get() as { count: number };
  if (checkOrders.count === 0) {
    // Create sample orders for testing
    const orderId1 = 'order-001';
    const orderId2 = 'order-002';

    // Sample order 1
    db.prepare('INSERT INTO orders (id, user_email, name, phone, address, notes, total, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(orderId1, 'customer@example.com', 'Nguyễn Văn A', '0123456789', '123 Đường ABC, Quận 1, TP.HCM', 'Giao hàng vào buổi sáng', 4850, 'Delivered', '2024-03-01 10:00:00');

    // Add items for order 1
    db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)')
      .run(orderId1, '5', 1, 4850); // Mặt Dây Chuyền Rồng Phỉ Thúy Đa Sắc

    // Sample order 2
    db.prepare('INSERT INTO orders (id, user_email, name, phone, address, notes, total, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(orderId2, 'guest@example.com', null, null, null, null, 2400, 'Processing', '2024-03-05 14:30:00');

    // Add items for order 2
    db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)')
      .run(orderId2, '2', 1, 2500); // Mặt Dây Chuyền Lục Bảo Hoàng Gia
    db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)')
      .run(orderId2, '1', 1, 1200); // Vòng Tay Phỉ Thúy Tím

    console.log('Database seeded with sample orders.');
  }

  const checkSettings = db.prepare('SELECT count(*) as count FROM settings').get() as { count: number };
  if (checkSettings.count === 0) {
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    const defaultSettings = [
      { key: 'bankName', value: 'Vietcombank' },
      { key: 'bankOwner', value: 'CÔNG TY TNHH THIÊN MỘC' },
      { key: 'bankNumber', value: '0123456789' },
      { key: 'bankQR', value: '' }
    ];
    const insertMany = db.transaction((settings: { key: string, value: string }[]) => {
      for (const setting of settings) {
        insertSetting.run(setting.key, setting.value);
      }
    });
    insertMany(defaultSettings);
    console.log('Database seeded with default settings.');
  }
}

export function getBankSettings() {
  const settings = db.prepare('SELECT * FROM settings WHERE key IN (?, ?, ?, ?)').all('bankName', 'bankOwner', 'bankNumber', 'bankQR') as any[];
  const result: any = {
    bankName: 'Vietcombank',
    bankOwner: 'CÔNG TY TNHH THIÊN MỘC',
    bankNumber: '0123456789',
    bankQR: ''
  };
  settings.forEach(s => {
    result[s.key] = s.value;
  });
  return result;
}

export function updateBankSettings(settings: { bankName?: string, bankOwner?: string, bankNumber?: string, bankQR?: string }) {
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const updateMany = db.transaction((items: { key: string, value: string }[]) => {
    for (const item of items) {
      upsert.run(item.key, item.value);
    }
  });

  const toUpdate = [];
  if (settings.bankName !== undefined) toUpdate.push({ key: 'bankName', value: settings.bankName });
  if (settings.bankOwner !== undefined) toUpdate.push({ key: 'bankOwner', value: settings.bankOwner });
  if (settings.bankNumber !== undefined) toUpdate.push({ key: 'bankNumber', value: settings.bankNumber });
  if (settings.bankQR !== undefined) toUpdate.push({ key: 'bankQR', value: settings.bankQR });

  updateMany(toUpdate);
  return { success: true };
}

export function getSocialSettings() {
  const settings = db.prepare('SELECT * FROM settings WHERE key IN (?, ?, ?, ?)').all('social_facebook', 'social_tiktok', 'social_instagram', 'social_telegram') as any[];
  const result: any = { facebook: '', tiktok: '', instagram: '', telegram: '' };
  settings.forEach(s => {
    const platform = s.key.replace('social_', '');
    result[platform] = s.value;
  });
  return result;
}

export function updateSocialSettings(settings: { facebook?: string, tiktok?: string, instagram?: string, telegram?: string }) {
  const update = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
  const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');

  const entries = Object.entries(settings);
  for (const [key, value] of entries) {
    if (value !== undefined) {
      const dbKey = `social_${key}`;
      insert.run(dbKey, value || '');
      update.run(value || '', dbKey);
    }
  }
  return { success: true };
}

export function getAllProducts(): Product[] {
  const rows = db.prepare('SELECT * FROM products').all() as any[];
  return rows.map(row => {
    let images = [];
    try {
      if (row.images) {
        images = JSON.parse(row.images);
      } else if (row.image) {
        images = [row.image];
      }
    } catch (e) {
      images = row.image ? [row.image] : [];
    }

    return {
      ...row,
      images,
      isNew: Boolean(row.isNew),
      isPremium: Boolean(row.isPremium),
      isBestSeller: Boolean(row.isBestSeller)
    };
  });
}

export function createOrder(order: { id: string; email: string; name: string; phone: string; address: string; notes?: string; total: number; items: any[]; receipt?: string; voucher_code?: string; voucher_id?: string }) {
  const insertOrder = db.prepare('INSERT INTO orders (id, user_email, name, phone, address, notes, total, status, receipt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');

  const executeOrder = db.transaction((data) => {
    insertOrder.run(data.id, data.email, data.name, data.phone, data.address, data.notes || '', data.total, 'Pending', data.receipt || null);
    for (const item of data.items) {
      insertItem.run(data.id, item.product.id, item.quantity, item.product.price);
    }

    if (data.voucher_code) {
      db.prepare('INSERT INTO used_vouchers (user_email, voucher_code, order_id) VALUES (?, ?, ?)').run(data.email, data.voucher_code, data.id);
      db.prepare('UPDATE vouchers SET usage_count = usage_count + 1 WHERE code = ?').run(data.voucher_code);
    }
  });

  executeOrder(order);
  return { success: true, orderId: order.id };
}

// Admin Functions

export function addProduct(product: Product) {
  const insert = db.prepare(`
    INSERT INTO products (id, name, description, price, category, collection, image, images, isNew, isPremium, isBestSeller)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insert.run(
    product.id,
    product.name,
    product.description,
    product.price,
    product.category,
    product.collection,
    product.image,
    JSON.stringify(product.images || [product.image]),
    product.isNew ? 1 : 0,
    product.isPremium ? 1 : 0,
    product.isBestSeller ? 1 : 0
  );
  return { success: true, product };
}

export function updateProduct(id: string, product: Partial<Product>) {
  const setClause = Object.keys(product)
    .filter(k => k !== 'id')
    .map(k => `${k} = ?`)
    .join(', ');

  const values = Object.keys(product)
    .filter(k => k !== 'id')
    .map(k => {
      const val = (product as any)[k];
      if (typeof val === 'boolean') return val ? 1 : 0;
      if (k === 'images') return JSON.stringify(val);
      return val;
    });

  const update = db.prepare(`UPDATE products SET ${setClause} WHERE id = ?`);
  update.run(...values, id);
  return { success: true };
}

export function deleteProduct(id: string) {
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return { success: true };
}

export function getAllOrders() {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as any[];
  return orders.map(order => {
    const items = db.prepare(`
      SELECT oi.*, p.name, p.image, p.category, p.collection
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(order.id);
    return { ...order, items };
  });
}

export function updateOrderStatus(id: string, status: string) {
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  return { success: true };
}

export function deleteOrder(id: string) {
  db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id);
  db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  return { success: true };
}

export function getAllVouchers() {
  const vouchers = db.prepare('SELECT * FROM vouchers').all() as any[];
  return vouchers.map(v => ({ ...v, is_active: Boolean(v.is_active) }));
}

export function addVoucher(voucher: { id: string; code: string; discount: number; type: string; is_active: boolean; usage_limit?: number; min_user_spending?: number }) {
  db.prepare('INSERT INTO vouchers (id, code, discount, type, is_active, usage_limit, min_user_spending, usage_count) VALUES (?, ?, ?, ?, ?, ?, ?, 0)')
    .run(voucher.id, voucher.code, voucher.discount, voucher.type, voucher.is_active ? 1 : 0, voucher.usage_limit || null, voucher.min_user_spending || 0);
  return { success: true };
}

export function updateVoucher(id: string, voucher: Partial<{ code: string; discount: number; type: string; is_active: boolean; usage_limit: number | null; min_user_spending: number }>) {
  const setClause = Object.keys(voucher)
    .filter(k => k !== 'id')
    .map(k => `${k} = ?`)
    .join(', ');

  const values = Object.keys(voucher)
    .filter(k => k !== 'id')
    .map(k => {
      const val = (voucher as any)[k];
      if (typeof val === 'boolean') return val ? 1 : 0;
      return val;
    });

  db.prepare(`UPDATE vouchers SET ${setClause} WHERE id = ?`).run(...values, id);
  return { success: true };
}

export function deleteVoucher(id: string) {
  db.prepare('DELETE FROM vouchers WHERE id = ?').run(id);
  return { success: true };
}

export function getVoucherByCode(code: string) {
  const voucher = db.prepare('SELECT * FROM vouchers WHERE code = ? AND is_active = 1').get() as any;
  if (!voucher) return null;
  return { ...voucher, is_active: Boolean(voucher.is_active) };
}

// Check usage limits and return boolean if the email has used it
export function hasUserUsedVoucher(email: string, voucherCode: string): boolean {
  const record = db.prepare('SELECT id FROM used_vouchers WHERE user_email = ? AND voucher_code = ?').get(email, voucherCode);
  return !!record;
}

export function getUserTotalSpent(email: string): number {
  const result = db.prepare(`
    SELECT SUM(total) as total_spent FROM orders 
    WHERE user_email = ? AND status != 'Cancelled' AND status != 'Đã Hủy'
  `).get(email) as { total_spent: number | null };
  return result?.total_spent || 0;
}

// User Functions

export function createUser(user: { id: string; email: string; password: string; name?: string }) {
  db.prepare('INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)')
    .run(user.id, user.email, user.password, user.name || null);
  return { success: true, userId: user.id };
}

export function getUserByEmail(email: string) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
}

export function getUserById(id: string) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
}

export function updateUserProfile(id: string, profile: { name?: string; phone?: string; address?: string }) {
  const setClause = Object.keys(profile)
    .filter(k => (profile as any)[k] !== undefined)
    .map(k => `${k} = ?`)
    .join(', ');

  if (!setClause) return { success: true };

  const values = Object.keys(profile)
    .filter(k => (profile as any)[k] !== undefined)
    .map(k => (profile as any)[k]);

  db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...values, id);
  return { success: true };
}

export function getUserOrders(email: string) {
  const orders = db.prepare('SELECT * FROM orders WHERE user_email = ? ORDER BY created_at DESC').all(email) as any[];
  return orders.map(order => {
    const items = db.prepare(`
      SELECT oi.*, p.name as product_name, p.image as product_image 
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(order.id);
    return { ...order, items };
  });
}

// Promotions Functions
export function getAllPromotions() {
  return db.prepare('SELECT * FROM promotions ORDER BY order_index ASC').all();
}

export function addPromotion(promo: any) {
  const insert = db.prepare('INSERT INTO promotions (title, subtitle, image, cta, order_index) VALUES (?, ?, ?, ?, ?)');
  const info = insert.run(promo.title, promo.subtitle, promo.image, promo.cta, promo.order_index || 0);
  return { id: info.lastInsertRowid, ...promo };
}

export function updatePromotion(id: string | number, promo: any) {
  const update = db.prepare('UPDATE promotions SET title = ?, subtitle = ?, image = ?, cta = ?, order_index = ? WHERE id = ?');
  update.run(promo.title, promo.subtitle, promo.image, promo.cta, promo.order_index || 0, id);
  return { id, ...promo };
}

export function deletePromotion(id: string | number) {
  const del = db.prepare('DELETE FROM promotions WHERE id = ?');
  del.run(id);
  return { success: true };
}

// Search Analytics & NLP Functions
const KNOWN_PHRASES = [
  'mat day chuyen', 'vong tay', 'bong tai', 'nhan', 'tram cai toc',
  'phi thuy', 'ngoc', 'luc bao', 'cam thach',
  'bang chung', 'nep bang chung', 'thuy tinh chung', 'muc duc', 'hoa bay', 'tu la lan', 'xanh tao', 'xanh cay'
];

const DISPLAY_MAP: Record<string, string> = {
  'mat day chuyen': 'Mặt Dây Chuyền',
  'vong tay': 'Vòng Tay',
  'bong tai': 'Bông Tai',
  'nhan': 'Nhẫn',
  'tram cai toc': 'Trâm Cài Tóc',
  'phi thuy': 'Phỉ Thúy',
  'ngoc': 'Ngọc',
  'luc bao': 'Lục Bảo',
  'cam thach': 'Cẩm Thạch',
  'bang chung': 'Băng Chủng',
  'nep bang chung': 'Nếp Băng Chủng',
  'thuy tinh chung': 'Thủy Tinh Chủng',
  'muc duc': 'Mực Dục',
  'hoa bay': 'Hoa Bay',
  'tu la lan': 'Tử La Lan',
  'xanh tao': 'Xanh Táo',
  'xanh cay': 'Xanh Cây'
};

export function logSearchKeyword(keyword: string) {
  if (!keyword || keyword.trim() === '') return { success: false };

  const rawKeyword = keyword.trim();
  let normalized = rawKeyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

  const extractedKeywords: string[] = [];

  // Extract known phrases greedily
  for (const phrase of KNOWN_PHRASES) {
    if (normalized.includes(phrase)) {
      extractedKeywords.push(phrase);
      normalized = normalized.replace(new RegExp(phrase, 'g'), ' ');
    }
  }

  const stopWords = ['cua', 'la', 'nhung', 'cac', 'chiec', 'cai', 'mot', 'cho', 'va'];
  const remainingWords = normalized.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));

  const finalKeywords = [...extractedKeywords, ...remainingWords];

  if (finalKeywords.length === 0) {
    finalKeywords.push(rawKeyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd'));
  }

  const insert = db.prepare('INSERT INTO search_keywords (keyword, normalized_keyword) VALUES (?, ?)');

  const execute = db.transaction((kws: string[]) => {
    for (const kw of kws) {
      insert.run(rawKeyword, kw);
    }
  });

  // Log unique extracted roots for this single search
  execute([...new Set(finalKeywords)]);
  return { success: true };
}

export function getSearchAnalytics() {
  // Get top 10 most searched normalized keywords
  const rows = db.prepare(`
    SELECT normalized_keyword as name, COUNT(*) as count 
    FROM search_keywords 
    GROUP BY normalized_keyword 
    ORDER BY count DESC 
    LIMIT 10
  `).all();

  // Try to find the most common actual "raw keyword" for each normalized group to show somewhat pretty names
  const results = rows.map((row: any) => {
    let prettyName = DISPLAY_MAP[row.name];

    if (!prettyName) {
      const topRaw = db.prepare(`
        SELECT keyword, COUNT(*) as c
        FROM search_keywords
        WHERE normalized_keyword = ?
        GROUP BY keyword
        ORDER BY c DESC
        LIMIT 1
      `).get(row.name) as { keyword: string };

      prettyName = topRaw ? topRaw.keyword.replace(/\b\w/g, l => l.toUpperCase()) : row.name.replace(/\b\w/g, (l: string) => l.toUpperCase());
    }

    return {
      name: prettyName,
      count: row.count,
      normalized: row.name
    };
  });

  return results;
}

export function clearSearchAnalytics() {
  db.prepare('DELETE FROM search_keywords').run();
  return { success: true };
}

// Blog Functions
export function getAllBlogs(includeUnpublished = false): any[] {
  let query = 'SELECT * FROM blogs ORDER BY created_at DESC';
  if (!includeUnpublished) {
    query = 'SELECT * FROM blogs WHERE is_published = 1 ORDER BY created_at DESC';
  }
  const rows = db.prepare(query).all() as any[];
  return rows.map(r => ({ ...r, is_published: Boolean(r.is_published), is_featured: Boolean(r.is_featured) }));
}

export function getFeaturedBlogs(): any[] {
  const rows = db.prepare('SELECT * FROM blogs WHERE is_published = 1 AND is_featured = 1 ORDER BY created_at DESC LIMIT 3').all() as any[];
  return rows.map(r => ({ ...r, is_published: Boolean(r.is_published), is_featured: Boolean(r.is_featured) }));
}

export function getBlogBySlug(slug: string): any {
  const row = db.prepare('SELECT * FROM blogs WHERE slug = ?').get(slug) as any;
  if (!row) return null;
  return { ...row, is_published: Boolean(row.is_published), is_featured: Boolean(row.is_featured) };
}

export function addBlog(blog: { id: string; title: string; slug: string; excerpt: string; content: string; image?: string; author: string; is_published: boolean; is_featured?: boolean }) {
  const insert = db.prepare('INSERT INTO blogs (id, title, slug, excerpt, content, image, author, is_published, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insert.run(blog.id, blog.title, blog.slug, blog.excerpt, blog.content, blog.image || '', blog.author, blog.is_published ? 1 : 0, blog.is_featured ? 1 : 0);
  return { success: true, blog };
}

export function updateBlog(id: string, blog: Partial<{ title: string; slug: string; excerpt: string; content: string; image: string; author: string; is_published: boolean; is_featured: boolean }>) {
  const setClause = Object.keys(blog)
    .filter(k => k !== 'id')
    .map(k => `${k} = ?`)
    .join(', ');

  const values = Object.keys(blog)
    .filter(k => k !== 'id')
    .map(k => {
      const val = (blog as any)[k];
      if (typeof val === 'boolean') return val ? 1 : 0;
      return val;
    });

  const update = db.prepare(`UPDATE blogs SET ${setClause} WHERE id = ?`);
  update.run(...values, id);
  return { success: true };
}

export function deleteBlog(id: string) {
  db.prepare('DELETE FROM blogs WHERE id = ?').run(id);
  return { success: true };
}

// Verification & Auth Functions
export function createEmailVerification(email: string, code: string, expires_at: Date) {
  db.prepare('INSERT OR REPLACE INTO email_verifications (email, code, expires_at) VALUES (?, ?, ?)').run(email, code, expires_at.toISOString());
}

export function verifyEmailCode(email: string, code: string): boolean {
  const record = db.prepare('SELECT * FROM email_verifications WHERE email = ? AND code = ? AND expires_at > datetime(\'now\')').get(email, code);
  if (record) {
    db.prepare('DELETE FROM email_verifications WHERE email = ?').run(email);
    return true;
  }
  return false;
}

export function markUserVerified(email: string) {
  db.prepare('UPDATE users SET is_verified = 1 WHERE email = ?').run(email);
}

export function createPasswordResetToken(email: string, token: string, expires_at: Date) {
  db.prepare('INSERT OR REPLACE INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)').run(email, token, expires_at.toISOString());
}

export function verifyPasswordResetToken(token: string): any {
  const record = db.prepare('SELECT email FROM password_resets WHERE token = ? AND expires_at > datetime(\'now\')').get(token) as any;
  if (record) {
    db.prepare('DELETE FROM password_resets WHERE email = ?').run(record.email);
    return record.email;
  }
  return null;
}

export function updatePassword(email: string, hash: string) {
  db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hash, email);
}

// Order Feedback Functions
export function saveOrderFeedback(order_id: string, rating: number, comment: string) {
  db.prepare('INSERT INTO order_feedback (order_id, rating, comment) VALUES (?, ?, ?)').run(order_id, rating, comment);
  return { success: true };
}

export function getOrderFeedback(order_id: string): any {
  return db.prepare('SELECT * FROM order_feedback WHERE order_id = ?').get(order_id);
}

// Admin Auth Functions
export function getAdminByEmail(email: string): any {
  return db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
}

export function getAdminById(id: number): any {
  return db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
}

export function getAllAdmins(): any[] {
  return db.prepare('SELECT id, email FROM admins').all();
}

export function addAdmin(email: string, passwordHash: string) {
  db.prepare('INSERT INTO admins (email, password) VALUES (?, ?)').run(email, passwordHash);
  return { success: true };
}

export function updateAdminCredentials(id: number, email: string, passwordHash: string) {
  db.prepare('UPDATE admins SET email = ?, password = ? WHERE id = ?').run(email, passwordHash, id);
  return { success: true };
}

export function updateAdminPassword(email: string, hash: string) {
  db.prepare('UPDATE admins SET password = ? WHERE email = ?').run(hash, email);
  return { success: true };
}

export default db;
