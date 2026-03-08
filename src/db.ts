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
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount REAL NOT NULL,
    type TEXT NOT NULL,
    is_active INTEGER DEFAULT 1
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
`);

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
    const insertVoucher = db.prepare('INSERT INTO vouchers (id, code, discount, type, is_active) VALUES (?, ?, ?, ?, ?)');
    insertVoucher.run('vouch-1', 'DISCOUNT10', 0.1, 'percent', 1);
    insertVoucher.run('vouch-2', 'MINUS500', 500, 'fixed', 1);
    console.log('Database seeded with initial vouchers.');
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

export function createOrder(order: { id: string; email: string; name: string; phone: string; address: string; notes?: string; total: number; items: any[]; receipt?: string }) {
  const insertOrder = db.prepare('INSERT INTO orders (id, user_email, name, phone, address, notes, total, status, receipt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');

  const executeOrder = db.transaction((data) => {
    insertOrder.run(data.id, data.email, data.name, data.phone, data.address, data.notes || '', data.total, 'Pending', data.receipt || null);
    for (const item of data.items) {
      insertItem.run(data.id, item.product.id, item.quantity, item.product.price);
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

export function addVoucher(voucher: { id: string; code: string; discount: number; type: string; is_active: boolean }) {
  db.prepare('INSERT INTO vouchers (id, code, discount, type, is_active) VALUES (?, ?, ?, ?, ?)')
    .run(voucher.id, voucher.code, voucher.discount, voucher.type, voucher.is_active ? 1 : 0);
  return { success: true };
}

export function updateVoucher(id: string, voucher: Partial<{ code: string; discount: number; type: string; is_active: boolean }>) {
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

export default db;
