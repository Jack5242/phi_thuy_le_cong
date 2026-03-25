import { Pool } from 'pg';
import { Product } from './types';

import bcrypt from 'bcryptjs';

const requiredEnv = ['DB_USER', 'DB_NAME', 'DB_PASSWORD'] as const;
const missingEnv = requiredEnv.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  throw new Error(`Missing required Postgres env vars: ${missingEnv.join(', ')}`);
}

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  // Sensible defaults to avoid excessive connection churn
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT_MS || '5000', 10),
});

const DB_DEBUG = (process.env.DB_DEBUG || '').toLowerCase() === 'true';

const db = {
  exec: async (sql: string): Promise<any> => {
    return pool.query(sql);
  },
  prepare: (sql: string) => {
    // Convert SQLite-style `?` placeholders to Postgres-style `$1..$n` once.
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => '$' + (index++));
    return {
      all: async (...args: any[]): Promise<any[]> => {
        const res = await pool.query(pgSql, args);
        return res.rows;
      },
      get: async (...args: any[]): Promise<any> => {
        const res = await pool.query(pgSql, args);
        return res.rows[0];
      },
      run: async (...args: any[]): Promise<any> => {
        const res = await pool.query(pgSql, args);
        const lastInsertRowid = res.rows?.[0]?.id;
        return { changes: res.rowCount, lastInsertRowid };
      }
    };
  },
  transaction: (fn: Function) => async (...args: any[]) => await fn(...args)
};


export async function initDb() {
  // Initialize tables
  await db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    description_en TEXT,
    price REAL NOT NULL,
    category TEXT,
    collection TEXT,
    image TEXT,
    images TEXT,
    isNew INTEGER DEFAULT 0,
    isPremium INTEGER DEFAULT 0,
    isBestSeller INTEGER DEFAULT 0,
    amount INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    name TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    total NUMERIC,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id TEXT,
    product_id TEXT,
    quantity INTEGER,
    price NUMERIC,
    FOREIGN KEY(order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS vouchers (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount NUMERIC NOT NULL,
    type TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    usage_limit INTEGER DEFAULT NULL,
    usage_count INTEGER DEFAULT 0,
    min_user_spending NUMERIC DEFAULT 0,
    user_email TEXT DEFAULT NULL,
    is_registration INTEGER DEFAULT 0,
    is_hidden INTEGER DEFAULT 0,
    min_order_value NUMERIC DEFAULT 0,
    max_discount_amount NUMERIC DEFAULT NULL
  );

  CREATE TABLE IF NOT EXISTS used_vouchers (
    id SERIAL PRIMARY KEY,
    user_email TEXT NOT NULL,
    voucher_code TEXT NOT NULL,
    order_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_email, voucher_code)
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    total_spent NUMERIC DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS promotions (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    title_en TEXT,
    subtitle TEXT NOT NULL,
    subtitle_en TEXT,
    image TEXT NOT NULL,
    cta TEXT NOT NULL,
    cta_en TEXT,
    order_index INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS search_keywords (
    id SERIAL PRIMARY KEY,
    keyword TEXT NOT NULL,
    normalized_keyword TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS blogs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT,
    image TEXT,
    author TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_published INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS email_verifications (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    email TEXT PRIMARY KEY,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
  );

  CREATE TABLE IF NOT EXISTS order_feedback (
    id SERIAL PRIMARY KEY,
    order_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS collections (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    name_en TEXT,
    description TEXT,
    description_en TEXT,
    slug TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS wishlist (
    id SERIAL PRIMARY KEY,
    user_email TEXT NOT NULL,
    product_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_email, product_id)
  );
`);

  // Migration for promotions localized fields
  const promotionsCols = await db.prepare("SELECT column_name as name FROM information_schema.columns WHERE table_name = 'promotions'").all();
  if (!promotionsCols.some((col: any) => col.name === 'title_en')) {
    try { await db.exec("ALTER TABLE promotions ADD COLUMN title_en TEXT").catch(() => { }); } catch (e) { }
  }
  if (!promotionsCols.some((col: any) => col.name === 'subtitle_en')) {
    try { await db.exec("ALTER TABLE promotions ADD COLUMN subtitle_en TEXT").catch(() => { }); } catch (e) { }
  }
  if (!promotionsCols.some((col: any) => col.name === 'cta_en')) {
    try { await db.exec("ALTER TABLE promotions ADD COLUMN cta_en TEXT").catch(() => { }); } catch (e) { }
  }

  try {
    await db.exec('ALTER TABLE collections ADD COLUMN description TEXT;');
  } catch (e) { /* Column already exists */ }
  try {
    await db.exec('ALTER TABLE collections ADD COLUMN description_en TEXT;');
  } catch (e) { /* Column already exists */ }
  try {
    await db.exec('ALTER TABLE collections ADD COLUMN slug TEXT UNIQUE;');
  } catch (e) { /* Column already exists */ }
  try {
    await db.exec('ALTER TABLE collections ADD UNIQUE (name);');
  } catch (e) { /* Constraint already exists */ }

  try {
    await db.exec('ALTER TABLE vouchers ALTER COLUMN id TYPE TEXT;');
    await db.exec('ALTER TABLE vouchers ALTER COLUMN id DROP DEFAULT;');
  } catch (e) { /* Incompatible or already altered */ }

  try {
    await db.exec('ALTER TABLE vouchers ADD COLUMN is_hidden INTEGER DEFAULT 0;');
  } catch (e) { /* Column already exists */ }
  try {
    await db.exec('ALTER TABLE vouchers ADD COLUMN min_order_value NUMERIC DEFAULT 0;');
  } catch (e) { /* Column already exists */ }

  // Seed default admin if none exists
  const checkAdmin = await db.prepare('SELECT count(*) as count FROM admins').get() as { count: number };
  if (checkAdmin.count === 0) {
    const adminEmail = process.env.ADMIN_EMAIL || 'cpuram0001@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
    const defaultHash = bcrypt.hashSync(adminPassword, 10);
    db.prepare('INSERT INTO admins (email, password) VALUES (?, ?)').run(adminEmail, defaultHash);
  }

  try {
    await db.exec('ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0;');
  } catch (e) {
    // Column already exists
  }

  try {
    await db.exec('ALTER TABLE products ADD COLUMN images TEXT;');
  } catch (e) {
    // Column already exists
  }

  try {
    await db.exec('ALTER TABLE products ADD COLUMN amount INTEGER DEFAULT 1;');
  } catch (e) {
    // Column already exists
  }

  try {
    await db.exec('ALTER TABLE products ADD COLUMN name_en TEXT;');
  } catch (e) {
    // Column already exists
  }

  try {
    await db.exec('ALTER TABLE products ADD COLUMN description_en TEXT;');
  } catch (e) {
    // Column already exists
  }

  try {
    await db.exec('ALTER TABLE orders ADD COLUMN name TEXT;');
    await db.exec('ALTER TABLE orders ADD COLUMN phone TEXT;');
    await db.exec('ALTER TABLE orders ADD COLUMN address TEXT;');
  } catch (e) {
    // Columns already exist
  }

  try {
    await db.exec('ALTER TABLE orders ADD COLUMN notes TEXT;');
  } catch (e) {
    // Column already exists
  }

  try {
    await db.exec('ALTER TABLE orders ADD COLUMN receipt TEXT;');
  } catch (e) {
    // Column already exists
  }

  try {
    await db.exec('ALTER TABLE vouchers ADD COLUMN usage_limit INTEGER DEFAULT NULL;');
    await db.exec('ALTER TABLE vouchers ADD COLUMN usage_count INTEGER DEFAULT 0;');
    await db.exec('ALTER TABLE vouchers ADD COLUMN min_user_spending REAL DEFAULT 0;');
  } catch (e) {
    // Columns already exist
  }

  try {
    await db.exec('ALTER TABLE vouchers ADD COLUMN user_email TEXT DEFAULT NULL;');
    await db.exec('ALTER TABLE vouchers ADD COLUMN is_registration INTEGER DEFAULT 0;');
  } catch (e) {
    // Columns already exist
  }

  try {
    await db.exec('ALTER TABLE blogs ADD COLUMN is_featured INTEGER DEFAULT 0;');
  } catch (e) {
    // Column already exists
  }


}

export async function seedProducts(products: Product[]) {
  const check = await db.prepare('SELECT count(*) as count FROM products').get() as { count: number };
  if (check.count === 0) {
    const insert = db.prepare(`
      INSERT INTO products (id, name, name_en, description, description_en, price, category, collection, image, images, isNew, isPremium, isBestSeller, amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction(async (items: Product[]) => {
      for (const item of items) {
        await insert.run(
          item.id,
          item.name,
          item.name_en || null,
          item.description,
          item.description_en || null,
          item.price,
          item.category,
          item.collection,
          item.image,
          JSON.stringify(item.images || [item.image]),
          item.isNew ? 1 : 0,
          item.isPremium ? 1 : 0,
          item.isBestSeller ? 1 : 0,
          item.amount !== undefined ? item.amount : 1
        );
      }
    });

    await insertMany(products);
    console.log('Database seeded with initial products.');
  }

  const checkVouchers = await db.prepare('SELECT count(*) as count FROM vouchers').get() as { count: any };
  if (Number(checkVouchers.count) === 0) {
    const insertVoucher = db.prepare('INSERT INTO vouchers (id, code, discount, type, is_active, usage_limit, usage_count, min_user_spending) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    await insertVoucher.run('vouch-1', 'DISCOUNT10', 0.1, 'percent', 1, null, 0, 0);
    await insertVoucher.run('vouch-2', 'MINUS500', 500, 'fixed', 1, 100, 0, 5000);
    console.log('Database seeded with initial vouchers.');
  }

  // Seed default social links
  const socialConfig = [
    { key: 'social_facebook', value: 'https://facebook.com/' },
    { key: 'social_tiktok', value: 'https://tiktok.com/' },
    { key: 'social_instagram', value: 'https://instagram.com/' },
    { key: 'social_telegram', value: 'https://telegram.org/' }
  ];
  const checkSocialSetting = await db.prepare("SELECT count(*) as count FROM settings WHERE key LIKE 'social_%'").get() as { count: number };
  if (checkSocialSetting.count === 0) {
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    for (const config of socialConfig) { await insertSetting.run(config.key, config.value); }
    console.log('Database seeded with initial social links.');
  }

  const checkUsers = await db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (checkUsers.count === 0) {
    const insertUser = db.prepare('INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)');
    const hash = bcrypt.hashSync('admin123', 10);
    await insertUser.run('admin-1', 'admin@teal.com', hash, 'Admin User');
    console.log('Database seeded with admin user.');
  }

  const checkPromotions = await db.prepare('SELECT count(*) as count FROM promotions').get() as { count: number };
  if (checkPromotions.count === 0) {
    const insertPromo = db.prepare('INSERT INTO promotions (title, subtitle, image, cta, order_index) VALUES (?, ?, ?, ?, ?)');
    await insertPromo.run("Khuyến Mãi Tết Nguyên Đán", "Giảm giá lên đến 20% cho Bộ Sưu Tập Lục Bảo Hoàng Gia", "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?q=80&w=1920&auto=format&fit=crop", "Mua Ngay", 0);
    await insertPromo.run("Giấc Mơ Sắc Tím", "Sản Phẩm Mới: Phỉ Thúy Tím Chạm Khắc Thủ Công", "https://images.unsplash.com/photo-1588444839799-eb642997a34f?q=80&w=1920&auto=format&fit=crop", "Khám Phá", 1);
    await insertPromo.run("Di Sản Thủ Công", "Khám phá bí mật của Ngọc Phỉ Thúy Myanmar", "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?q=80&w=1920&auto=format&fit=crop", "Tìm Hiểu Thêm", 2);
    console.log('Database seeded with initial promotions.');
  }

  const checkOrders = await db.prepare('SELECT count(*) as count FROM orders').get() as { count: number };
  if (checkOrders.count === 0) {
    // Create sample orders for testing
    const orderId1 = 'order-001';
    const orderId2 = 'order-002';

    // Sample order 1
    await db.prepare('INSERT INTO orders (id, user_email, name, phone, address, notes, total, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(orderId1, 'customer@example.com', 'Nguyễn Văn A', '0123456789', '123 Đường ABC, Quận 1, TP.HCM', 'Giao hàng vào buổi sáng', 4850, 'Delivered', '2024-03-01 10:00:00');

    // Add items for order 1
    await db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)')
      .run(orderId1, '5', 1, 4850); // Mặt Dây Chuyền Rồng Phỉ Thúy Đa Sắc

    // Sample order 2
    await db.prepare('INSERT INTO orders (id, user_email, name, phone, address, notes, total, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(orderId2, 'guest@example.com', null, null, null, null, 2400, 'Processing', '2024-03-05 14:30:00');

    // Add items for order 2
    await db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)')
      .run(orderId2, '2', 1, 2500); // Mặt Dây Chuyền Lục Bảo Hoàng Gia
    await db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)')
      .run(orderId2, '1', 1, 1200); // Vòng Tay Phỉ Thúy Tím

    console.log('Database seeded with sample orders.');
  }

  const checkSettings = await db.prepare('SELECT count(*) as count FROM settings').get() as { count: number };
  if (checkSettings.count === 0) {
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    const defaultSettings = [
      { key: 'bankName', value: 'Vietcombank' },
      { key: 'bankOwner', value: 'CÔNG TY TNHH THIÊN MỘC' },
      { key: 'bankNumber', value: '0123456789' },
      { key: 'bankQR', value: '' },
      { key: 'registration_voucher_discount', value: '0.1' },
      { key: 'registration_voucher_type', value: 'percent' }
    ];
    const insertMany = db.transaction(async (settings: { key: string, value: string }[]) => {
      for (const setting of settings) {
        await insertSetting.run(setting.key, setting.value);
      }
    });
    await insertMany(defaultSettings);
    console.log('Database seeded with default settings.');
  }

  // Seed collections from existing products if none exist
  const checkCollections = await db.prepare('SELECT count(*) as count FROM collections').get() as { count: number };
  if (checkCollections.count === 0) {
    const allProducts = await db.prepare('SELECT DISTINCT collection FROM products WHERE collection IS NOT NULL AND collection != \'\'').all() as { collection: string }[];
    const insertCollection = db.prepare('INSERT INTO collections (name, slug) VALUES (?, ?) ON CONFLICT (name) DO NOTHING');
    const insertMany = db.transaction(async (items: { collection: string }[]) => {
      for (const item of items) {
        const slug = item.collection.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        await insertCollection.run(item.collection, slug);
      }
    });
    await insertMany(allProducts);
    console.log(`Database seeded with ${allProducts.length} product line(s) from existing products.`);
  }

  // PostgreSQL Migration: Add total_spent column if it doesn't exist
  try {
    const columnCheck = await db.prepare(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'total_spent'
    `).get();

    if (!columnCheck) {
      console.log('Migrating: Adding total_spent column to users table...');
      await db.exec('ALTER TABLE users ADD COLUMN total_spent NUMERIC DEFAULT 0');
      
      // Perform one-time backfill
      await db.exec(`
        UPDATE users 
        SET total_spent = COALESCE((
          SELECT SUM(total) 
          FROM orders 
          WHERE orders.user_email = users.email 
            AND status != 'Cancelled' 
            AND status != 'Đã Hủy'
        ), 0)
      `);
      console.log('Successfully added total_spent column and synchronized historical data.');
    }
    // PostgreSQL Migration: Add max_discount_amount column to vouchers if it doesn't exist
  try {
    const voucherColumnCheck = await db.prepare(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vouchers' AND column_name = 'max_discount_amount'
    `).get();

    if (!voucherColumnCheck) {
      console.log('Migrating: Adding max_discount_amount column to vouchers table...');
      await db.exec('ALTER TABLE vouchers ADD COLUMN max_discount_amount NUMERIC DEFAULT NULL');
      console.log('Successfully added max_discount_amount column to vouchers table.');
    }
  } catch (err: any) {
    console.error('Error during vouchers migration:', err.message);
  }
} catch (err: any) {
    console.error('Error during total_spent migration:', err.message);
  }
}

// Collections
export async function getAllCollections() {
  return await db.prepare('SELECT * FROM collections ORDER BY id ASC').all();
}

export async function addCollection(collection: { name: string; name_en?: string; description?: string; description_en?: string; slug?: string }) {
  const { name, name_en, description, description_en, slug } = collection;
  const autoSlug = slug || name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  return db.prepare('INSERT INTO collections (name, name_en, description, description_en, slug) VALUES (?, ?, ?, ?, ?)')
    .run(name, name_en || null, description || null, description_en || null, autoSlug);
}

export async function updateCollection(id: string | number, collection: { name: string; name_en?: string; description?: string; description_en?: string; slug?: string }) {
  const { name, name_en, description, description_en, slug } = collection;
  const autoSlug = slug || name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  return db.prepare('UPDATE collections SET name = ?, name_en = ?, description = ?, description_en = ?, slug = ? WHERE id = ?')
    .run(name, name_en || null, description || null, description_en || null, autoSlug, id);
}

export async function deleteCollection(id: string | number) {
  return await db.prepare('DELETE FROM collections WHERE id = ?').run(id);
}

export async function getBankSettings() {
  const settings = await db.prepare('SELECT * FROM settings WHERE key IN (?, ?, ?, ?)').all('bankName', 'bankOwner', 'bankNumber', 'bankQR') as any[];
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

export async function updateBankSettings(settings: { bankName?: string, bankOwner?: string, bankNumber?: string, bankQR?: string }) {
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value');
  const updateMany = db.transaction(async (items: { key: string, value: string }[]) => {
    for (const item of items) {
      await upsert.run(item.key, item.value);
    }
  });

  const toUpdate = [];
  if (settings.bankName !== undefined) toUpdate.push({ key: 'bankName', value: settings.bankName });
  if (settings.bankOwner !== undefined) toUpdate.push({ key: 'bankOwner', value: settings.bankOwner });
  if (settings.bankNumber !== undefined) toUpdate.push({ key: 'bankNumber', value: settings.bankNumber });
  if (settings.bankQR !== undefined) toUpdate.push({ key: 'bankQR', value: settings.bankQR });

  await updateMany(toUpdate);
  return { success: true };
}

export async function getSocialSettings() {
  const settings = await db.prepare('SELECT * FROM settings WHERE key IN (?, ?, ?, ?, ?)').all('social_facebook', 'social_tiktok', 'social_instagram', 'social_telegram', 'social_zalo') as any[];
  const result: any = { facebook: '', tiktok: '', instagram: '', telegram: '', zalo: '' };
  settings.forEach(s => {
    const platform = s.key.replace('social_', '');
    result[platform] = s.value;
  });
  return result;
}

export async function updateSocialSettings(settings: { facebook?: string, tiktok?: string, instagram?: string, telegram?: string, zalo?: string }) {
  const update = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
  const insert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO NOTHING');

  const entries = Object.entries(settings);
  for (const [key, value] of entries) {
    if (value !== undefined) {
      const dbKey = `social_${key}`;
      await insert.run(dbKey, value || '');
      await update.run(value || '', dbKey);
    }
  }
  return { success: true };
}

export async function getContactSettings() {
  const settings = await db.prepare('SELECT * FROM settings WHERE key IN (?, ?, ?, ?)').all('contact_address', 'contact_phone', 'contact_email', 'contact_working_hours') as any[];
  const result: any = { address: '', phone: '', email: '', workingHours: '' };
  settings.forEach(s => {
    const field = s.key.replace('contact_', '');
    if (field === 'working_hours') result.workingHours = s.value;
    else result[field] = s.value;
  });
  return result;
}

export async function updateContactSettings(settings: { address?: string, phone?: string, email?: string, workingHours?: string }) {
  const update = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
  const insert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO NOTHING');

  const entries = Object.entries(settings);
  for (const [key, value] of entries) {
    if (value !== undefined) {
      const dbKey = key === 'workingHours' ? 'contact_working_hours' : `contact_${key}`;
      await insert.run(dbKey, value || '');
      await update.run(value || '', dbKey);
    }
  }
  return { success: true };
}

export async function getAllProducts(): Promise<Product[]> {
  const rows = await db.prepare(`
    SELECT p.*, c.name_en AS collection_en 
    FROM products p
    LEFT JOIN collections c ON p.collection = c.name
  `).all() as any[];
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
      price: Number(row.price),
      amount: row.amount !== null ? Number(row.amount) : undefined,
      images,
      isNew: Boolean(row.isNew ?? row.isnew),
      isPremium: Boolean(row.isPremium ?? row.ispremium),
      isBestSeller: Boolean(row.isBestSeller ?? row.isbestseller)
    };
  });
}

export async function createOrder(order: { id: string; email: string; name: string; phone: string; address: string; notes?: string; total: number; items: any[]; receipt?: string; voucher_code?: string; voucher_id?: string }) {
  const insertOrder = db.prepare('INSERT INTO orders (id, user_email, name, phone, address, notes, total, status, receipt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');

  const executeOrder = db.transaction(async (data) => {
    await insertOrder.run(data.id, data.email, data.name, data.phone, data.address, data.notes || '', data.total, 'Pending', data.receipt || null);
    for (const item of data.items) {
      await insertItem.run(data.id, item.product.id, item.quantity, item.product.price);
    }

    if (data.voucher_code) {
      db.prepare('INSERT INTO used_vouchers (user_email, voucher_code, order_id) VALUES (?, ?, ?)').run(data.email, data.voucher_code, data.id);
      await db.prepare('UPDATE vouchers SET usage_count = usage_count + 1 WHERE code = ?').run(data.voucher_code);
    }

    // Increment user's total_spent
    await db.prepare('UPDATE users SET total_spent = total_spent + ? WHERE email = ?').run(data.total, data.email);
  });

  await executeOrder(order);
  const updatedUser = await getUserByEmail(order.email);
  return { success: true, orderId: order.id, user: updatedUser };
}

// Admin Functions

export async function addProduct(product: Product) {
  const insert = db.prepare(`
    INSERT INTO products (id, name, name_en, description, description_en, price, category, collection, image, images, isNew, isPremium, isBestSeller, amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  await insert.run(
    product.id,
    product.name,
    product.name_en || null,
    product.description,
    product.description_en || null,
    product.price,
    product.category,
    product.collection,
    product.image,
    JSON.stringify(product.images || [product.image]),
    product.isNew ? 1 : 0,
    product.isPremium ? 1 : 0,
    product.isBestSeller ? 1 : 0,
    product.amount !== undefined ? product.amount : 1
  );
  return { success: true, product };
}

export async function updateProduct(id: string, product: Partial<Product>) {
  const allowedKeys = ['name', 'name_en', 'description', 'description_en', 'price', 'category', 'collection', 'image', 'images', 'isNew', 'isPremium', 'isBestSeller', 'amount'];
  const filteredKeys = Object.keys(product).filter(k => allowedKeys.includes(k) && k !== 'id');
  const setClause = filteredKeys.map(k => `${k} = ?`).join(', ');

  const values = filteredKeys.map(k => {
    const val = (product as any)[k];
    if (typeof val === 'boolean') return val ? 1 : 0;
    if (k === 'images') return JSON.stringify(val);
    return val;
  });

  const update = db.prepare(`UPDATE products SET ${setClause} WHERE id = ?`);
  await update.run(...values, id);
  return { success: true };
}

export async function deleteProduct(id: string) {
  await db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return { success: true };
}

export async function getAllOrders() {
  const orders = await db.prepare(`
    SELECT o.*, uv.voucher_code, v.discount as voucher_discount, v.type as voucher_type
    FROM orders o
    LEFT JOIN used_vouchers uv ON o.id = uv.order_id
    LEFT JOIN vouchers v ON uv.voucher_code = v.code
    ORDER BY o.created_at DESC
  `).all() as any[];
  return await Promise.all(orders.map(async order => {
    const items = await db.prepare(`
      SELECT oi.*, p.name, p.name_en, p.image, p.category, p.collection, c.name_en AS collection_en
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN collections c ON p.collection = c.name
      WHERE oi.order_id = ?
    `).all(order.id);
    return { 
      ...order, 
      items,
      voucher_discount: order.voucher_discount ? Number(order.voucher_discount) : undefined
    };
  }));
}

export async function updateOrderStatus(id: string, status: string) {
  const order = await db.prepare('SELECT user_email, total, status FROM orders WHERE id = ?').get(id) as { user_email: string; total: number; status: string } | undefined;
  
  if (order && order.user_email) {
    const isOldCancelled = order.status === 'Cancelled' || order.status === 'Đã Hủy';
    const isNewCancelled = status === 'Cancelled' || status === 'Đã Hủy';
    
    if (!isOldCancelled && isNewCancelled) {
      await db.prepare('UPDATE users SET total_spent = total_spent - ? WHERE email = ?').run(order.total, order.user_email);
    } else if (isOldCancelled && !isNewCancelled) {
      await db.prepare('UPDATE users SET total_spent = total_spent + ? WHERE email = ?').run(order.total, order.user_email);
    }
  }

  await db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  return { success: true };
}

export async function deleteOrder(id: string) {
  const order = await db.prepare('SELECT user_email, total, status FROM orders WHERE id = ?').get(id) as { user_email: string; total: number; status: string } | undefined;

  await db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id);
  await db.prepare('DELETE FROM orders WHERE id = ?').run(id);

  if (order && order.user_email && order.status !== 'Cancelled' && order.status !== 'Đã Hủy' && order.status !== 'Delivered' && order.status !== 'Hoàn Thành') {
    await db.prepare('UPDATE users SET total_spent = total_spent - ? WHERE email = ?').run(order.total, order.user_email);
  }

  return { success: true };
}

export async function getAllVouchers() {
  const vouchers = await db.prepare('SELECT * FROM vouchers').all() as any[];
  return vouchers.map(v => ({
    ...v,
    is_active: Boolean(v.is_active),
    discount: parseFloat(v.discount),
    min_user_spending: parseFloat(v.min_user_spending || 0),
    min_order_value: parseFloat(v.min_order_value || 0),
    max_discount_amount: v.max_discount_amount !== null ? parseFloat(v.max_discount_amount) : null,
    is_hidden: Boolean(v.is_hidden),
    type: v.type === 'percentage' ? 'percent' : v.type
  }));
}

export async function addVoucher(voucher: { id: string; code: string; discount: number; type: string; is_active: boolean; usage_limit?: number; min_user_spending?: number; min_order_value?: number; is_hidden?: boolean; user_email?: string; is_registration?: boolean; max_discount_amount?: number | null }) {
  await db.prepare('INSERT INTO vouchers (id, code, discount, type, is_active, usage_limit, min_user_spending, min_order_value, is_hidden, usage_count, user_email, is_registration, max_discount_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)')
    .run(voucher.id, voucher.code, voucher.discount, voucher.type, voucher.is_active ? 1 : 0, voucher.usage_limit || null, voucher.min_user_spending || 0, voucher.min_order_value || 0, voucher.is_hidden ? 1 : 0, voucher.user_email || null, voucher.is_registration ? 1 : 0, voucher.max_discount_amount || null);
  return { success: true };
}

export async function updateVoucher(id: string, voucher: Partial<{ code: string; discount: number; type: string; is_active: boolean; usage_limit: number | null; min_user_spending: number; min_order_value: number; max_discount_amount: number | null; is_hidden: boolean }>) {
  const allowedKeys = ['code', 'discount', 'type', 'is_active', 'usage_limit', 'min_user_spending', 'min_order_value', 'max_discount_amount', 'is_hidden', 'is_registration'];
  const filteredKeys = Object.keys(voucher).filter(k => allowedKeys.includes(k));
  
  if (filteredKeys.length === 0) return { success: true };

  const setClause = filteredKeys.map(k => `${k} = ?`).join(', ');

  const values = filteredKeys.map(k => {
    const val = (voucher as any)[k];
      if (typeof val === 'boolean') return val ? 1 : 0;
      if (val === '') return null;
      return val;
    });

  await db.prepare(`UPDATE vouchers SET ${setClause} WHERE id = ?`).run(...values, id);
  return { success: true };
}

export async function getAllAvailableVouchersForUser(email: string) {
  if (DB_DEBUG) console.log(`[DB Debug] Fetching vouchers for: '${email}'`);
  const vouchers = await db.prepare('SELECT * FROM vouchers WHERE is_active = 1 AND is_hidden = 0 AND (user_email IS NULL OR TRIM(user_email) = \'\' OR LOWER(user_email) = LOWER(?))').all(email) as any[];
  if (DB_DEBUG) console.log(`[DB Debug] Query matched ${vouchers.length} vouchers`);
  return vouchers.map(v => ({
    ...v,
    is_active: Boolean(v.is_active),
    discount: parseFloat(v.discount),
    min_user_spending: parseFloat(v.min_user_spending || 0),
    min_order_value: parseFloat(v.min_order_value || 0),
    max_discount_amount: v.max_discount_amount !== null ? parseFloat(v.max_discount_amount) : null,
    is_hidden: Boolean(v.is_hidden),
    type: v.type === 'percentage' ? 'percent' : v.type
  }));
}

export async function getWelcomeVoucherTemplate() {
  const voucher = await db.prepare('SELECT * FROM vouchers WHERE is_registration = 1 LIMIT 1').get() as any;
  if (!voucher) return null;
  return {
    ...voucher,
    is_active: Boolean(voucher.is_active),
    discount: parseFloat(voucher.discount),
    min_user_spending: parseFloat(voucher.min_user_spending || 0),
    min_order_value: parseFloat(voucher.min_order_value || 0),
    max_discount_amount: voucher.max_discount_amount !== null ? parseFloat(voucher.max_discount_amount) : null,
    is_hidden: Boolean(voucher.is_hidden),
    is_registration: Boolean(voucher.is_registration)
  };
}

export async function deleteVoucher(id: string) {
  await db.prepare('DELETE FROM vouchers WHERE id = ?').run(id);
  return { success: true };
}

export async function getVoucherByCode(code: string) {
  const voucher = await db.prepare('SELECT * FROM vouchers WHERE code = ? AND is_active = 1').get(code) as any;
  if (!voucher) return null;
  return {
    ...voucher,
    is_active: Boolean(voucher.is_active),
    discount: parseFloat(voucher.discount),
    min_user_spending: parseFloat(voucher.min_user_spending || 0),
    min_order_value: parseFloat(voucher.min_order_value || 0),
    max_discount_amount: voucher.max_discount_amount !== null ? parseFloat(voucher.max_discount_amount) : null,
    is_hidden: Boolean(voucher.is_hidden),
    type: voucher.type === 'percentage' ? 'percent' : voucher.type
  };
}

export async function hasUserUsedVoucher(email: string, voucherCode: string): Promise<boolean> {
  const record = await db.prepare('SELECT id FROM used_vouchers WHERE LOWER(user_email) = LOWER(?) AND voucher_code = ?').get(email, voucherCode);
  return !!record;
}

export async function getUserTotalSpent(email: string): Promise<number> {
  const result = await db.prepare(`SELECT total_spent FROM users WHERE email = ?`).get(email) as { total_spent: number | null };
  return Number(result?.total_spent) || 0;
}

// User Functions

export async function createUser(user: { id: string; email: string; password: string; name?: string }) {
  db.prepare('INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)')
    .run(user.id, user.email, user.password, user.name || null);
  return { success: true, userId: user.id };
}

export async function getUserByEmail(email: string) {
  return await db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
}

export async function getUserById(id: string) {
  return await db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
}

export async function updateUserProfile(id: string, profile: { name?: string; phone?: string; address?: string }) {
  const setClause = Object.keys(profile)
    .filter(k => (profile as any)[k] !== undefined)
    .map(k => `${k} = ?`)
    .join(', ');

  if (!setClause) return { success: true };

  const values = Object.keys(profile)
    .filter(k => (profile as any)[k] !== undefined)
    .map(k => (profile as any)[k]);

  await db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...values, id);
  return { success: true };
}

export async function getWishlist(email: string) {
  const items = await db.prepare('SELECT product_id FROM wishlist WHERE user_email = ? ORDER BY created_at DESC').all(email) as any[];
  if (!items.length) return [];
  const productIds = items.map(i => i.product_id);
  const placeholders = productIds.map(() => '?').join(',');
  const rows = await db.prepare(`
    SELECT p.*, c.name_en AS collection_en 
    FROM products p
    LEFT JOIN collections c ON p.collection = c.name
    WHERE p.id IN (${placeholders})
  `).all(...productIds) as any[];
  
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
      price: Number(row.price),
      amount: row.amount !== null ? Number(row.amount) : undefined,
      images,
      isNew: Boolean(row.isNew ?? row.isnew),
      isPremium: Boolean(row.isPremium ?? row.ispremium),
      isBestSeller: Boolean(row.isBestSeller ?? row.isbestseller)
    };
  });
}

export async function addToWishlist(email: string, productId: string) {
  await db.prepare('INSERT INTO wishlist (user_email, product_id) VALUES (?, ?) ON CONFLICT DO NOTHING').run(email, productId);
  return { success: true };
}

export async function removeFromWishlist(email: string, productId: string) {
  await db.prepare('DELETE FROM wishlist WHERE user_email = ? AND product_id = ?').run(email, productId);
  return { success: true };
}

export async function isInWishlist(email: string, productId: string) {
  const item = await db.prepare('SELECT 1 FROM wishlist WHERE user_email = ? AND product_id = ?').get(email, productId);
  return !!item;
}

export async function getUserOrders(email: string) {
  const orders = await db.prepare(`
    SELECT o.*, uv.voucher_code, v.discount as voucher_discount, v.type as voucher_type
    FROM orders o
    LEFT JOIN used_vouchers uv ON o.id = uv.order_id
    LEFT JOIN vouchers v ON uv.voucher_code = v.code
    WHERE o.user_email = ? 
    ORDER BY o.created_at DESC
  `).all(email) as any[];
  return await Promise.all(orders.map(async order => {
    const items = await db.prepare(`
      SELECT oi.*, p.name as product_name, p.name_en as product_name_en, p.image as product_image, p.collection, c.name_en AS collection_en
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN collections c ON p.collection = c.name
      WHERE oi.order_id = ?
    `).all(order.id);
    return { 
      ...order, 
      items,
      voucher_discount: order.voucher_discount ? Number(order.voucher_discount) : undefined
    };
  }));
}

// Promotions Functions
export async function getAllPromotions() {
  return await db.prepare('SELECT * FROM promotions ORDER BY order_index ASC').all();
}

export async function addPromotion(promo: any) {
  // RETURNING id so callers can get the created promotion id
  const insert = db.prepare('INSERT INTO promotions (title, title_en, subtitle, subtitle_en, image, cta, cta_en, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id');
  const info = await insert.run(promo.title, promo.title_en || null, promo.subtitle, promo.subtitle_en || null, promo.image, promo.cta, promo.cta_en || null, promo.order_index || 0);
  return { id: info.lastInsertRowid, ...promo };
}

export async function updatePromotion(id: string | number, promo: any) {
  const update = db.prepare('UPDATE promotions SET title = ?, title_en = ?, subtitle = ?, subtitle_en = ?, image = ?, cta = ?, cta_en = ?, order_index = ? WHERE id = ?');
  await update.run(promo.title, promo.title_en || null, promo.subtitle, promo.subtitle_en || null, promo.image, promo.cta, promo.cta_en || null, promo.order_index || 0, id);
  return { id, ...promo };
}

export async function deletePromotion(id: string | number) {
  const del = db.prepare('DELETE FROM promotions WHERE id = ?');
  await del.run(id);
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

export async function logSearchKeyword(keyword: string) {
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

  const execute = db.transaction(async (kws: string[]) => {
    for (const kw of kws) {
      await insert.run(rawKeyword, kw);
    }
  });

  // Log unique extracted roots for this single search
  await execute([...new Set(finalKeywords)]);
  return { success: true };
}

export async function getSearchAnalytics() {
  // Get top 10 most searched normalized keywords
  const rows = await db.prepare(`
    SELECT normalized_keyword as name, COUNT(*) as count 
    FROM search_keywords 
    GROUP BY normalized_keyword 
    ORDER BY count DESC 
    LIMIT 10
  `).all();

  // Try to find the most common actual "raw keyword" for each normalized group to show somewhat pretty names
  const results = await Promise.all(rows.map(async (row: any) => {
    let prettyName = DISPLAY_MAP[row.name];

    if (!prettyName) {
      const topRaw = await db.prepare(`
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
  }));

  return results;
}

export async function clearSearchAnalytics() {
  await db.prepare('DELETE FROM search_keywords').run();
  return { success: true };
}

// Blog Functions
export async function getAllBlogs(includeUnpublished = false): Promise<any[]> {
  let query = 'SELECT * FROM blogs ORDER BY created_at DESC';
  if (!includeUnpublished) {
    query = 'SELECT * FROM blogs WHERE is_published = 1 ORDER BY created_at DESC';
  }
  const rows = await db.prepare(query).all() as any[];
  return rows.map(r => ({ ...r, is_published: Boolean(r.is_published), is_featured: Boolean(r.is_featured) }));
}

export async function getFeaturedBlogs(): Promise<any[]> {
  const rows = await db.prepare('SELECT * FROM blogs WHERE is_published = 1 AND is_featured = 1 ORDER BY created_at DESC LIMIT 3').all() as any[];
  return rows.map(r => ({ ...r, is_published: Boolean(r.is_published), is_featured: Boolean(r.is_featured) }));
}

export async function getBlogBySlug(slug: string): Promise<any> {
  const row = await db.prepare('SELECT * FROM blogs WHERE slug = ?').get(slug) as any;
  if (!row) return null;
  return { ...row, is_published: Boolean(row.is_published), is_featured: Boolean(row.is_featured) };
}

export async function getBlogById(id: string): Promise<any> {
  const row = await db.prepare('SELECT * FROM blogs WHERE id = ?').get(id) as any;
  if (!row) return null;
  return { ...row, is_published: Boolean(row.is_published), is_featured: Boolean(row.is_featured) };
}

export async function addBlog(blog: { id: string; title: string; slug: string; excerpt: string; content: string; image?: string; author: string; is_published: boolean; is_featured?: boolean }) {
  const insert = db.prepare('INSERT INTO blogs (id, title, slug, excerpt, content, image, author, is_published, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  await insert.run(blog.id, blog.title, blog.slug, blog.excerpt, blog.content, blog.image || '', blog.author, blog.is_published ? 1 : 0, blog.is_featured ? 1 : 0);
  return { success: true, blog };
}

export async function updateBlog(id: string, blog: Partial<{ title: string; slug: string; excerpt: string; content: string; image: string; author: string; is_published: boolean; is_featured: boolean }>) {
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
  await update.run(...values, id);
  return { success: true };
}

export async function deleteBlog(id: string) {
  await db.prepare('DELETE FROM blogs WHERE id = ?').run(id);
  return { success: true };
}

// Verification & Auth Functions
export async function createEmailVerification(email: string, code: string, expires_at: Date) {
  await db.prepare('INSERT INTO email_verifications (email, code, expires_at) VALUES (?, ?, ?) ON CONFLICT (email) DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at').run(email, code, expires_at);
}

export async function verifyEmailCode(email: string, code: string): Promise<boolean> {
  const record = await db.prepare('SELECT * FROM email_verifications WHERE email = ? AND code = ? AND expires_at > CURRENT_TIMESTAMP').get(email, code);
  if (record) {
    await db.prepare('DELETE FROM email_verifications WHERE email = ?').run(email);
    return true;
  }
  return false;
}

export async function markUserVerified(email: string) {
  await db.prepare('UPDATE users SET is_verified = 1 WHERE email = ?').run(email);
}

export async function createPasswordResetToken(email: string, token: string, expires_at: Date) {
  await db.prepare('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?) ON CONFLICT (email) DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at').run(email, token, expires_at);
}

export async function verifyPasswordResetToken(token: string): Promise<any> {
  const record = await db.prepare('SELECT email FROM password_resets WHERE token = ? AND expires_at > CURRENT_TIMESTAMP').get(token) as any;
  if (record) {
    await db.prepare('DELETE FROM password_resets WHERE email = ?').run(record.email);
    return record.email;
  }
  return null;
}

export async function updatePassword(email: string, hash: string) {
  await db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hash, email);
}

// Order Feedback Functions
export async function saveOrderFeedback(order_id: string, rating: number, comment: string) {
  await db.prepare('INSERT INTO order_feedback (order_id, rating, comment) VALUES (?, ?, ?)').run(order_id, rating, comment);
  return { success: true };
}

export async function getOrderFeedback(order_id: string): Promise<any> {
  return await db.prepare('SELECT * FROM order_feedback WHERE order_id = ?').get(order_id);
}

// Admin Auth Functions
export async function getAdminByEmail(email: string): Promise<any> {
  return await db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
}

export async function getAdminById(id: number): Promise<any> {
  return await db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
}

export async function getAllAdmins(): Promise<any[]> {
  return await db.prepare('SELECT id, email FROM admins').all();
}

export async function addAdmin(email: string, passwordHash: string) {
  db.prepare('INSERT INTO admins (email, password) VALUES (?, ?)').run(email, passwordHash);
  return { success: true };
}

export async function updateAdminCredentials(id: number, email: string, passwordHash: string) {
  await db.prepare('UPDATE admins SET email = ?, password = ? WHERE id = ?').run(email, passwordHash, id);
  return { success: true };
}

export async function updateAdminPassword(email: string, hash: string) {
  await db.prepare('UPDATE admins SET password = ? WHERE email = ?').run(hash, email);
  return { success: true };
}

export async function deleteAdmin(id: number) {
  await db.prepare('DELETE FROM admins WHERE id = ?').run(id);
  return { success: true };
}

export default db;
