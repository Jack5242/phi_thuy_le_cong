import './env.js';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { PRODUCTS } from './src/constants';
import db, { initDb, seedProducts, getAllProducts, createOrder, addProduct, updateProduct, deleteProduct, getAllOrders, updateOrderStatus, deleteOrder, getAllVouchers, addVoucher, updateVoucher, deleteVoucher, getVoucherByCode, createUser, getUserByEmail, getUserById, updateUserProfile, getUserOrders, getAllPromotions, addPromotion, updatePromotion, deletePromotion, hasUserUsedVoucher, getUserTotalSpent, logSearchKeyword, getSearchAnalytics, clearSearchAnalytics, getAllBlogs, getBlogBySlug, getBlogById, addBlog, updateBlog, deleteBlog, createEmailVerification, verifyEmailCode, markUserVerified, createPasswordResetToken, verifyPasswordResetToken, updatePassword, saveOrderFeedback, getOrderFeedback, getAdminByEmail, getAdminById, getAllAdmins, addAdmin, updateAdminCredentials, updateAdminPassword, getBankSettings, updateBankSettings, getSocialSettings, updateSocialSettings, getContactSettings, updateContactSettings, getFeaturedBlogs, getRegistrationVoucherDiscount, updateRegistrationVoucherDiscount, getAllAvailableVouchersForUser, getAllCollections, addCollection, updateCollection, deleteCollection } from './src/db';
import { sendVerificationEmail, sendPasswordResetEmail, sendFeedbackRequestEmail, sendWelcomeVoucherEmail } from './email';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

import { translate } from 'google-translate-api-x';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-123';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'products');
const BLOG_UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'blogs');
const BANK_UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'bank');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(BLOG_UPLOADS_DIR)) {
  fs.mkdirSync(BLOG_UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(BANK_UPLOADS_DIR)) {
  fs.mkdirSync(BANK_UPLOADS_DIR, { recursive: true });
}

// Multer configuration for blogs
const blogStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, BLOG_UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `blog_${Date.now()}${ext}`);
  }
});

const uploadBlog = multer({ storage: blogStorage });

// Multer configuration for bank QR
const bankStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, BANK_UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `bank_qr_${Date.now()}${ext}`);
  }
});

const uploadBank = multer({ storage: bankStorage });

function processProductImages(productId: string, images: string[]) {
  const productDir = path.join(UPLOADS_DIR, productId);
  if (!fs.existsSync(productDir)) {
    fs.mkdirSync(productDir, { recursive: true });
  }

  const processedImages: string[] = [];

  images.forEach((img, index) => {
    if (img.startsWith('data:image')) {
      const matches = img.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        let ext = matches[1];
        if (ext === 'jpeg') ext = 'jpg';
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `img_${Date.now()}_${index}.${ext}`;
        const filepath = path.join(productDir, filename);
        fs.writeFileSync(filepath, buffer);
        processedImages.push(`/uploads/products/${productId}/${filename}`);
      }
    } else {
      processedImages.push(img);
    }
  });

  if (fs.existsSync(productDir)) {
    const files = fs.readdirSync(productDir);
    files.forEach(file => {
      const fileUrl = `/uploads/products/${productId}/${file}`;
      if (!processedImages.includes(fileUrl)) {
        fs.unlinkSync(path.join(productDir, file));
      }
    });
  }

  return processedImages;
}

function deleteProductFolder(productId: string) {
  const productDir = path.join(UPLOADS_DIR, productId);
  if (fs.existsSync(productDir)) {
    fs.rmSync(productDir, { recursive: true, force: true });
  }
}

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Truy cập bị từ chối' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Mã xác thực không hợp lệ' });
    req.user = user;
    next();
  });
};

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  const validatePassword = (password: string) => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  };

  const validatePhone = (phone: string) => {
    const digits = String(phone || '').replace(/\D/g, '');
    return digits.length >= 10;
  };

  const validateAddress = (address: string) => {
    return address && address.trim().length >= 5;
  };

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Seed database on startup
  await initDb();
  await seedProducts(PRODUCTS);

  // API Routes
  app.get('/api/products', async (req, res) => {
    try {
      const products = await getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: 'Lấy danh sách sản phẩm thất bại' });
    }
  });

  app.get('/api/promotions', async (req, res) => {
    try {
      const promotions = await getAllPromotions();
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ error: 'Lấy danh sách khuyến mãi thất bại' });
    }
  });

  app.get('/api/settings/bank', async (req, res) => {
    try {
      const settings = await getBankSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Lấy thông tin ngân hàng thất bại' });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const { email, name, phone, address, notes, total, items, receipt, voucher_code, voucher_id } = req.body;
      const orderEmail = email || 'guest@example.com';

      if (!validatePhone(phone)) {
        return res.status(400).json({ error: 'Số điện thoại phải có ít nhất 10 chữ số.' });
      }
      if (!validateAddress(address)) {
        return res.status(400).json({ error: 'Địa chỉ phải có ít nhất 5 ký tự.' });
      }

      // Perform voucher validation again right before order creation
      if (voucher_code) {
        const voucher = await getVoucherByCode(voucher_code);
        if (!voucher) {
          return res.status(400).json({ error: 'Mã giảm giá không hợp lệ hoặc đã bị vô hiệu' });
        }
        if (voucher.usage_limit && voucher.usage_count >= voucher.usage_limit) {
          return res.status(400).json({ error: 'Mã giảm giá đã hết lượt sử dụng' });
        }
        if (await hasUserUsedVoucher(orderEmail, voucher_code)) {
          return res.status(400).json({ error: 'Bạn đã sử dụng mã giảm giá này rồi' });
        }
        const totalSpent = await getUserTotalSpent(orderEmail);
        if (voucher.min_user_spending && totalSpent < voucher.min_user_spending) {
          return res.status(400).json({ error: `Bạn cần chi tiêu ít nhất ${voucher.min_user_spending.toLocaleString()} VND để sử dụng mã giảm giá này` });
        }
      }

      const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const result = await createOrder({
        id: orderId,
        email: orderEmail,
        name, phone, address, notes, total, items, receipt,
        voucher_code, voucher_id
      });

      if (email) {
        sendFeedbackRequestEmail(email, orderId).catch(console.error);
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Tạo đơn hàng thất bại' });
    }
  });

  // Auth Routes
  app.post('/api/auth/request-verification', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email là bắt buộc' });

      const existingUser = await getUserByEmail(email);
      if (existingUser) return res.status(400).json({ error: 'Email này đã được đăng ký' });

      const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
      const expiresAt = new Date(Date.now() + 15 * 60000); // 15 mins
      await createEmailVerification(email, code, expiresAt);

      await sendVerificationEmail(email, code);
      res.json({ success: true, message: 'Mã xác nhận đã được gửi' });
    } catch (error) {
      res.status(500).json({ error: 'Gửi mã xác nhận thất bại' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name, code } = req.body;

      if (!email || !password || !code) {
        return res.status(400).json({ error: 'Email, mật khẩu và mã xác nhận là bắt buộc' });
      }

      if (!validatePassword(password)) {
        return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa và 1 chữ số.' });
      }

      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email này đã được đăng ký' });
      }

      if (!await verifyEmailCode(email, code)) {
        return res.status(400).json({ error: 'Mã xác nhận không hợp lệ hoặc đã hết hạn' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;

      await createUser({ id: userId, email, password: hashedPassword, name });
      await markUserVerified(email);

      // Issue Welcome Voucher
      try {
        const regConfig = await getRegistrationVoucherDiscount();
        const voucherCode = `WELCOME-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const voucherId = `reg-vouch-${Date.now()}`;

        await addVoucher({
          id: voucherId,
          code: voucherCode,
          discount: regConfig.discount,
          type: regConfig.type,
          is_active: true,
          usage_limit: 1,
          user_email: email,
          is_registration: true
        });

        sendWelcomeVoucherEmail(email, voucherCode, regConfig.discount, regConfig.type).catch(console.error);
      } catch (vouchErr) {
        console.error('Failed to issue welcome voucher:', vouchErr);
      }

      const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: userId, email, name, is_verified: true } });
    } catch (error) {
      res.status(500).json({ error: 'Đăng ký người dùng thất bại' });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      const user = await getUserByEmail(email);
      if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + 60 * 60000); // 1 hr
      await createPasswordResetToken(email, token, expiresAt);

      const appDomain = process.env.APP_URL || 'http://localhost:5173';
      const resetLink = `${appDomain}/?view=reset-password&token=${token}`;
      await sendPasswordResetEmail(email, resetLink);

      res.json({ success: true, message: 'Link đặt lại mật khẩu đã được gửi' });
    } catch (error) {
      res.status(500).json({ error: 'Xử lý yêu cầu thất bại' });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) return res.status(400).json({ error: 'Token và mật khẩu mới là bắt buộc' });

      if (!validatePassword(newPassword)) {
        return res.status(400).json({ error: 'Mật khẩu mới không hợp lệ.' });
      }

      const email = await verifyPasswordResetToken(token);
      if (!email) return res.status(400).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await updatePassword(email, hashedPassword);

      res.json({ success: true, message: 'Mật khẩu đã được đặt lại' });
    } catch (error) {
      res.status(500).json({ error: 'Đặt lại mật khẩu thất bại' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ error: 'Email hoặc mật khẩu không chính xác' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'Email hoặc mật khẩu không chính xác' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
      res.status(500).json({ error: 'Đăng nhập thất bại' });
    }
  });

  // User Profile Routes
  app.get('/api/users/profile', authenticateToken, async (req: any, res: any) => {
    try {
      let user = await getUserById(req.user.id); if (!user && req.user.email) { user = (await db.prepare('SELECT * FROM users WHERE email = ?').all(req.user.email) as any[])[0]; } if (!user) return res.status(404).json({ error: 'User not found (Token ID: ' + req.user.id + ', Token Email: ' + req.user.email + ')' });
      if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  app.put('/api/users/profile', authenticateToken, async (req: any, res: any) => {
    try {
      const { name, phone, address } = req.body;
      if (!validatePhone(phone)) {
        return res.status(400).json({ error: 'Số điện thoại không hợp lệ.' });
      }
      if (!validateAddress(address)) {
        return res.status(400).json({ error: 'Địa chỉ không hợp lệ.' });
      }
      await updateUserProfile(req.user.id, { name, phone, address });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Cập nhật hồ sơ thất bại' });
    }
  });

  app.put('/api/users/profile/password', authenticateToken, async (req: any, res: any) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc.' });
      }

      if (!validatePassword(newPassword)) {
        return res.status(400).json({ error: 'Mật khẩu mới không đủ độ mạnh.' });
      }

      let user = await getUserById(req.user.id);
      if (!user && req.user.email) {
        user = (await db.prepare('SELECT * FROM users WHERE email = ?').all(req.user.email) as any[])[0];
      }
      if (!user) {
        return res.status(404).json({ error: `User not found (ID: ${req.user.id}, Email: ${req.user.email})` });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await updatePassword(user.email, hashedPassword);

      res.json({ success: true, message: 'Mật khẩu đã được cập nhật thành công' });
    } catch (error) {
      res.status(500).json({ error: 'Cập nhật mật khẩu thất bại' });
    }
  });

  app.post('/api/auth/profile/forgot-password', authenticateToken, async (req: any, res: any) => {
    try {
      let user = await getUserById(req.user.id);
      if (!user && req.user.email) {
        user = (await db.prepare('SELECT * FROM users WHERE email = ?').all(req.user.email) as any[])[0];
      }
      if (!user) {
        return res.status(404).json({ error: `User not found (ID: ${req.user.id}, Email: ${req.user.email})` });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
      const expiresAt = new Date(Date.now() + 15 * 60000); // 15 mins
      await createEmailVerification(user.email, code, expiresAt);

      await sendVerificationEmail(user.email, code);
      res.json({ success: true, message: 'Mã xác nhận đã được gửi đến email của bạn' });
    } catch (error) {
      res.status(500).json({ error: 'Gửi mã xác nhận thất bại' });
    }
  });

  app.post('/api/auth/profile/reset-password-with-code', authenticateToken, async (req: any, res: any) => {
    try {
      const { code, newPassword } = req.body;
      if (!code || !newPassword) {
        return res.status(400).json({ error: 'Mã xác nhận và mật khẩu mới là bắt buộc' });
      }

      if (!validatePassword(newPassword)) {
        return res.status(400).json({ error: 'Mật khẩu mới không hợp lệ.' });
      }

      let user = await getUserById(req.user.id);
      if (!user && req.user.email) {
        user = (await db.prepare('SELECT * FROM users WHERE email = ?').all(req.user.email) as any[])[0];
      }
      if (!user) {
        return res.status(404).json({ error: `User not found (ID: ${req.user.id}, Email: ${req.user.email})` });
      }

      if (!await verifyEmailCode(user.email, code)) {
        return res.status(400).json({ error: 'Mã xác nhận không chính xác hoặc đã hết hạn.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await updatePassword(user.email, hashedPassword);

      res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });
    } catch (error) {
      res.status(500).json({ error: 'Đặt lại mật khẩu thất bại' });
    }
  });

  app.get('/api/users/orders', authenticateToken, async (req: any, res: any) => {
    try {
      let user = await getUserById(req.user.id); if (!user && req.user.email) { user = (await db.prepare('SELECT * FROM users WHERE email = ?').all(req.user.email) as any[])[0]; } if (!user) return res.status(404).json({ error: 'User not found (Token ID: ' + req.user.id + ', Token Email: ' + req.user.email + ')' });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const orders = await getUserOrders(user.email);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Lấy danh sách đơn hàng thất bại' });
    }
  });

  // Feedback Routes
  app.post('/api/orders/:id/feedback', async (req, res) => {
    try {
      const { rating, comment } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Đánh giá từ 1 đến 5 là bắt buộc' });
      }
      const existing = await getOrderFeedback(req.params.id);
      if (existing) {
        return res.status(400).json({ error: 'Bạn đã gửi đánh giá cho đơn hàng này rồi' });
      }
      const result = await saveOrderFeedback(req.params.id, rating, comment || '');
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Lưu đánh giá thất bại' });
    }
  });

  app.get('/api/admin/orders/:id/feedback', async (req, res) => {
    try {
      const feedback = await getOrderFeedback(req.params.id);
      res.json(feedback || { success: false, message: 'Không tìm thấy đánh giá' });
    } catch (error) {
      res.status(500).json({ error: 'Lấy đánh giá thất bại' });
    }
  });

  // Admin Routes
  app.post('/api/admin/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const admin = await getAdminByEmail(email);

      if (!admin) {
        return res.status(401).json({ error: 'Sai thông tin đăng nhập quản trị' });
      }

      const validPassword = await bcrypt.compare(password, admin.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Sai thông tin đăng nhập quản trị' });
      }

      // We sign the token with an explicit role to distinguish it from a normal user
      const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, admin: { id: admin.id, email: admin.email } });
    } catch (error) {
      res.status(500).json({ error: 'Đăng nhập quản trị thất bại' });
    }
  });

  app.put('/api/admin/settings', authenticateToken, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Truy cập bị từ chối. Cần quyền quản trị.' });
      }

      const { newEmail, currentPassword, newPassword } = req.body;
      if (!newEmail || !currentPassword) {
        return res.status(400).json({ error: 'Email và mật khẩu hiện tại là bắt buộc.' });
      }

      const admin = await getAdminById(req.user.id);
      if (!admin) return res.status(404).json({ error: 'Không tìm thấy quản trị viên.' });

      const validPassword = await bcrypt.compare(currentPassword, admin.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác.' });
      }

      if (newPassword) {
        if (!validatePassword(newPassword)) {
          return res.status(400).json({ error: 'Mật khẩu mới không đủ độ mạnh.' });
        }
      }

      // If they provided a new password, hash it. Otherwise, keep the old one.
      const passwordToSave = newPassword ? await bcrypt.hash(newPassword, 10) : admin.password;

      // Update the DB
      await updateAdminCredentials(admin.id, newEmail, passwordToSave);

      // We issue a new token in case the email is stored inside it
      const newToken = jwt.sign({ id: admin.id, email: newEmail, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });

      res.json({ success: true, token: newToken, admin: { id: admin.id, email: newEmail } });
    } catch (error) {
      if ((error as any).code === '23505') {
        return res.status(400).json({ error: 'Email này đã tồn tại.' });
      }
      res.status(500).json({ error: 'Cập nhật cài đặt quản trị thất bại.' });
    }
  });

  app.put('/api/admin/settings/bank', authenticateToken, uploadBank.single('bankQR'), async (req: any, res: any) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Truy cập bị từ chối. Cần quyền quản trị.' });
      }

      const { bankName, bankOwner, bankNumber, bankQR_url } = req.body;
      let bankQR = bankQR_url || '';

      if (req.file) {
        // Fetch current settings to get the old image path
        const currentSettings = await getBankSettings();
        const oldBankQR = currentSettings.bankQR;

        bankQR = `/uploads/bank/${req.file.filename}`;

        // Remove old file if it exists and is a local file
        if (oldBankQR && oldBankQR !== bankQR && oldBankQR.startsWith('/uploads/')) {
          const oldPath = path.join(process.cwd(), oldBankQR);
          if (fs.existsSync(oldPath)) {
            try {
              fs.unlinkSync(oldPath);
            } catch (err) {
              console.error(`Failed to delete old bank QR: ${oldPath}`, err);
            }
          }
        }
      }

      const result = await updateBankSettings({ bankName, bankOwner, bankNumber, bankQR });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Cập nhật thông tin ngân hàng thất bại.' });
    }
  });

  app.put('/api/admin/settings/social', authenticateToken, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Truy cập bị từ chối. Cần quyền quản trị.' });
      }

      const { facebook, tiktok, instagram, telegram } = req.body;
      const result = await updateSocialSettings({ facebook, tiktok, instagram, telegram });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Cập nhật liên kết mạng xã hội thất bại.' });
    }
  });

  app.put('/api/admin/settings/contact', authenticateToken, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Truy cập bị từ chối. Cần quyền quản trị.' });
      }

      const { address, phone, email, workingHours } = req.body;
      const result = await updateContactSettings({ address, phone, email, workingHours });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Cập nhật thông tin liên hệ thất bại.' });
    }
  });


  app.get('/api/admin/admins', authenticateToken, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Truy cập bị từ chối. Cần quyền quản trị.' });
      res.json(await getAllAdmins());
    } catch (error) {
      res.status(500).json({ error: 'Lấy danh sách quản trị viên thất bại' });
    }
  });

  app.post('/api/admin/admins', authenticateToken, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Truy cập bị từ chối. Cần quyền quản trị.' });
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' });

      if (!validatePassword(password)) {
        return res.status(400).json({ error: 'Mật khẩu không đạt yêu cầu.' });
      }

      const existing = await getAdminByEmail(email);
      if (existing) return res.status(400).json({ error: 'Email quản trị này đã được đăng ký' });

      const hashedPassword = await bcrypt.hash(password, 10);
      await addAdmin(email, hashedPassword);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Tạo quản trị viên thất bại' });
    }
  });

  app.post('/api/admin/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      const admin = await getAdminByEmail(email);
      if (!admin) {
        // Obfuscate to prevent enumeration
        return res.json({ success: true, message: 'Link khôi phục đã được gửi' });
      }

      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + 60 * 60000); // 1 hr

      await createPasswordResetToken(email, token, expiresAt);

      const appDomain = process.env.APP_URL || 'http://localhost:3000';
      const resetLink = `${appDomain}/?view=admin-reset-password&token=${token}`;

      await sendPasswordResetEmail(email, resetLink);

      res.json({ success: true, message: 'Link khôi phục đã được gửi' });
    } catch (error) {
      res.status(500).json({ error: 'Xử lý yêu cầu thất bại' });
    }
  });

  app.post('/api/admin/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) return res.status(400).json({ error: 'Token và mật khẩu mới là bắt buộc' });

      if (!validatePassword(newPassword)) {
        return res.status(400).json({ error: 'Mật khẩu mới không đạt yêu cầu.' });
      }

      const email = await verifyPasswordResetToken(token);
      if (!email) return res.status(400).json({ error: 'Token khôi phục không hợp lệ hoặc đã hết hạn' });

      const admin = await getAdminByEmail(email);
      if (!admin) return res.status(400).json({ error: 'Không tìm thấy tài khoản quản trị' });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await updateAdminPassword(email, hashedPassword);

      res.json({ success: true, message: 'Đặt lại mật khẩu quản trị thành công' });
    } catch (error) {
      res.status(500).json({ error: 'Đặt lại mật khẩu quản trị thất bại' });
    }
  });

  app.post('/api/admin/products', async (req, res) => {
    try {
      const productData = req.body;
      if (productData.images && productData.images.length > 0) {
        productData.images = processProductImages(productData.id, productData.images);
        productData.image = productData.images[0];
      }
      const result = await addProduct(productData);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Thêm sản phẩm thất bại' });
    }
  });

  app.put('/api/admin/products/:id', async (req, res) => {
    try {
      const productData = req.body;
      if (productData.images && productData.images.length > 0) {
        productData.images = processProductImages(req.params.id, productData.images);
        productData.image = productData.images[0];
      } else {
        productData.images = [];
        productData.image = '';
        deleteProductFolder(req.params.id);
      }
      const result = await updateProduct(req.params.id, productData);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Cập nhật sản phẩm thất bại' });
    }
  });

  app.post('/api/admin/translate', async (req, res) => {
    try {
      const { text, from = 'vi', to = 'en' } = req.body;
      if (!text) return res.status(400).json({ error: 'Không có văn bản để dịch' });

      const result = await translate(text, { from, to }) as any;
      res.json({ translatedText: result.text });
    } catch (error) {
      console.error('Translation error:', error);
      res.status(500).json({ error: 'Dịch thuật thất bại' });
    }
  });

  app.delete('/api/admin/products/:id', async (req, res) => {
    try {
      deleteProductFolder(req.params.id);
      const result = await deleteProduct(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Xóa sản phẩm thất bại' });
    }
  });

  app.get('/api/admin/orders', async (req, res) => {
    try {
      const orders = await getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Lấy danh sách đơn hàng thất bại' });
    }
  });

  app.put('/api/admin/orders/:id/status', async (req, res) => {
    try {
      const result = await updateOrderStatus(req.params.id, req.body.status);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Cập nhật trạng thái đơn hàng thất bại' });
    }
  });

  app.delete('/api/admin/orders/:id', async (req, res) => {
    try {
      const result = await deleteOrder(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Xóa đơn hàng thất bại' });
    }
  });

  app.get('/api/admin/vouchers', async (req, res) => {
    try {
      const vouchers = await getAllVouchers();
      res.json(vouchers);
    } catch (error) {
      res.status(500).json({ error: 'Lấy danh sách mã giảm giá thất bại' });
    }
  });

  app.post('/api/admin/vouchers', async (req, res) => {
    try {
      const result = await addVoucher(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Thêm mã giảm giá thất bại' });
    }
  });

  app.put('/api/admin/vouchers/:id', async (req, res) => {
    try {
      const result = await updateVoucher(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Cập nhật mã giảm giá thất bại' });
    }
  });

  app.get('/api/admin/settings/registration-discount', authenticateToken, async (req: any, res: any) => {
    try {
      res.json(await getRegistrationVoucherDiscount());
    } catch (error) {
      res.status(500).json({ error: 'Lấy thông tin giảm giá đăng ký thất bại' });
    }
  });

  app.put('/api/admin/settings/registration-discount', authenticateToken, async (req: any, res: any) => {
    try {
      const { discount, type } = req.body;
      const result = await updateRegistrationVoucherDiscount(parseFloat(discount), type || 'percent');
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Cập nhật thông tin giảm giá đăng ký thất bại' });
    }
  });

  app.delete('/api/admin/vouchers/:id', async (req, res) => {
    try {
      const result = await deleteVoucher(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Xóa mã giảm giá thất bại' });
    }
  });

  app.get('/api/vouchers/:code', async (req, res, next) => {
    // Avoid clashing with more specific routes like `/api/vouchers/available`.
    if (req.params.code === 'available') return next();
    try {
      const voucher = await getVoucherByCode(req.params.code);
      if (voucher) {
        res.json(voucher);
      } else {
        res.status(404).json({ error: 'Mã giảm giá không tìm thấy hoặc không hoạt động' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Lấy thông tin mã giảm giá thất bại' });
    }
  });

  app.post('/api/vouchers/validate', async (req, res) => {
    try {
      const { code, email } = req.body;
      if (!code || !email) {
        return res.status(400).json({ error: 'Mã giảm giá và email là bắt buộc' });
      }

      const voucher = await getVoucherByCode(code);
      if (!voucher) {
        return res.status(404).json({ error: 'Mã giảm giá không tìm thấy hoặc đã bị vô hiệu hóa' });
      }

      // Check global limit
      if (voucher.usage_limit && voucher.usage_count >= voucher.usage_limit) {
        return res.status(400).json({ error: 'Mã giảm giá đã hết lượt sử dụng' });
      }

      // Check unique usage per user
      if (await hasUserUsedVoucher(email, code)) {
        return res.status(400).json({ error: 'Bạn đã sử dụng mã giảm giá này rồi' });
      }

      // Check if voucher is tied to this user
      if (voucher.user_email && voucher.user_email !== email) {
        return res.status(403).json({ error: 'Mã giảm giá này không hợp lệ cho tài khoản của bạn.' });
      }

      // Check minimum spending eligibility
      const totalSpent = await getUserTotalSpent(email);
      if (voucher.min_user_spending && totalSpent < voucher.min_user_spending) {
        return res.status(400).json({ error: `Bạn cần chi tiêu ít nhất ${voucher.min_user_spending.toLocaleString()} VND để sử dụng mã giảm giá này` });
      }

      // If all checks pass
      res.json({ success: true, voucher });
    } catch (error) {
      res.status(500).json({ error: 'Kiểm tra mã giảm giá thất bại' });
    }
  });

  app.get('/api/vouchers/available', async (req, res) => {
    try {
      // Email is only required to show user-specific vouchers.
      // Universal vouchers (where `user_email` is NULL) should still be returned
      // even if the client does not send an email (or sends an empty string).
      const email = typeof req.query.email === 'string' ? req.query.email : '';

      const allVouchers = await getAllAvailableVouchersForUser(email);
      const availableVouchers: any[] = [];
      for (const v of allVouchers) {
        if (!v.is_active) continue;
        if (v.usage_limit && v.usage_count >= v.usage_limit) continue;
        if (await hasUserUsedVoucher(email, v.code)) continue;
        if (v.is_registration) continue;
        availableVouchers.push(v);
      }

      res.json(availableVouchers);
    } catch (error) {
      res.status(500).json({ error: 'Lấy danh sách mã giảm giá khả dụng thất bại' });
    }
  });

  // Admin Promotions Routes
  app.get('/api/admin/promotions', async (req, res) => {
    try {
      const promotions = await getAllPromotions();
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch promotions' });
    }
  });

  app.post('/api/admin/promotions', async (req, res) => {
    try {
      const result = await addPromotion(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Thêm chương trình khuyến mãi thất bại' });
    }
  });

  app.put('/api/admin/promotions/:id', async (req, res) => {
    try {
      const result = await updatePromotion(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Cập nhật chương trình khuyến mãi thất bại' });
    }
  });

  app.delete('/api/admin/promotions/:id', async (req, res) => {
    try {
      const result = await deletePromotion(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Xóa chương trình khuyến mãi thất bại' });
    }
  });

  // Blog Routes
  // IMPORTANT: /api/blogs/featured must be registered BEFORE /api/blogs/:slug
  app.get('/api/blogs/featured', async (req, res) => {
    try {
      const blogs = await getFeaturedBlogs();
      res.json(blogs);
    } catch (error) {
      res.status(500).json({ error: 'Lấy danh sách bài viết nổi bật thất bại' });
    }
  });

  app.get('/api/blogs', async (req, res) => {
    try {
      const blogs = await getAllBlogs(false); // only published
      res.json(blogs);
    } catch (error) {
      res.status(500).json({ error: 'Lấy danh sách bài viết thất bại' });
    }
  });

  app.get('/api/blogs/:slug', async (req, res) => {
    try {
      const blog = await getBlogBySlug(req.params.slug);
      if (blog && blog.is_published) {
        res.json(blog);
      } else {
        res.status(404).json({ error: 'Không tìm thấy bài viết' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Lấy chi tiết bài viết thất bại' });
    }
  });

  app.get('/api/admin/blogs', async (req, res) => {
    try {
      const blogs = await getAllBlogs(true); // all blogs
      res.json(blogs);
    } catch (error) {
      res.status(500).json({ error: 'Lấy danh sách bài viết quản trị thất bại' });
    }
  });

  app.post('/api/admin/blogs', uploadBlog.single('image'), async (req, res) => {
    try {
      const blogData = req.body;
      if (req.file) {
        blogData.image = `/uploads/blogs/${req.file.filename}`;
      }
      // FormData sends booleans as strings
      if (typeof blogData.is_published === 'string') {
        blogData.is_published = blogData.is_published === 'true';
      }
      if (typeof blogData.is_featured === 'string') {
        blogData.is_featured = blogData.is_featured === 'true';
      }
      const result = await addBlog(blogData);
      res.json(result);
    } catch (error) {
      console.error('Error adding blog:', error);
      res.status(500).json({ error: 'Thêm bài viết thất bại' });
    }
  });

  app.put('/api/admin/blogs/:id', uploadBlog.single('image'), async (req, res) => {
    try {
      const blogData = req.body;

      // Fetch the existing blog to get its current image path
      const oldBlog = await getBlogById(req.params.id);
      const oldImage = oldBlog?.image;

      if (req.file) {
        blogData.image = `/uploads/blogs/${req.file.filename}`;

        // Remove the old image file if it exists and is different from the new one
        if (oldImage && oldImage !== blogData.image && oldImage.startsWith('/uploads/')) {
          const oldPath = path.join(process.cwd(), oldImage);
          if (fs.existsSync(oldPath)) {
            try {
              fs.unlinkSync(oldPath);
            } catch (err) {
              console.error(`Failed to delete old blog image: ${oldPath}`, err);
            }
          }
        }
      } else if (blogData.image_url) {
        // Keep existing image — image_url is the fallback sent when no new file is selected
        blogData.image = blogData.image_url;
      }
      // Remove image_url so it doesn't get passed to updateBlog (no such column)
      delete blogData.image_url;

      // Convert boolean fields if they came as string from FormData
      if (typeof blogData.is_published === 'string') {
        blogData.is_published = blogData.is_published === 'true';
      }
      if (typeof blogData.is_featured === 'string') {
        blogData.is_featured = blogData.is_featured === 'true';
      }

      const result = await updateBlog(req.params.id, blogData);
      res.json(result);
    } catch (error) {
      console.error('Error updating blog:', error);
      res.status(500).json({ error: 'Cập nhật bài viết thất bại' });
    }
  });

  app.delete('/api/admin/blogs/:id', async (req, res) => {
    try {
      // Get the current blog to find the image path before deleting it
      const blog = await getBlogById(req.params.id);
      const blogImage = blog?.image;

      const result = await deleteBlog(req.params.id);

      // If deletion was successful and there was a local image, remove it
      if (result.success && blogImage && blogImage.startsWith('/uploads/')) {
        const imagePath = path.join(process.cwd(), blogImage);
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
          } catch (err) {
            console.error(`Failed to delete blog image file: ${imagePath}`, err);
          }
        }
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Xóa bài viết thất bại' });
    }
  });

  // Search Analytics Routes
  app.post('/api/search/log', async (req, res) => {
    try {
      const { keyword } = req.body;
      const result = await logSearchKeyword(keyword);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Ghi nhật ký từ khóa tìm kiếm thất bại' });
    }
  });

  app.get('/api/admin/search-analytics', async (req, res) => {
    try {
      const result = await getSearchAnalytics();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Lấy thống kê tìm kiếm thất bại' });
    }
  });

  app.delete('/api/admin/search-analytics', async (req, res) => {
    try {
      const result = await clearSearchAnalytics();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Xóa thống kê tìm kiếm thất bại' });
    }
  });

  // Public settings endpoint for social links
  app.get('/api/settings/social', async (req, res) => {
    try {
      res.json(await getSocialSettings());
    } catch (error) {
      res.status(500).json({ error: 'Lấy liên kết mạng xã hội thất bại' });
    }
  });

  app.get('/api/settings/contact', async (req, res) => {
    try {
      res.json(await getContactSettings());
    } catch (error) {
      res.status(500).json({ error: 'Lấy thông tin liên hệ thất bại' });
    }
  });

  // Collections Routes
  app.get('/api/collections', async (req, res) => {
    try {
      res.json(await getAllCollections());
    } catch (error) {
      res.status(500).json({ error: 'Lấy danh sách dòng sản phẩm thất bại' });
    }
  });

  app.post('/api/admin/collections', authenticateToken, async (req, res) => {
    try {
      res.json(await addCollection(req.body));
    } catch (error) {
      res.status(500).json({ error: 'Thêm dòng sản phẩm thất bại' });
    }
  });

  app.put('/api/admin/collections/:id', authenticateToken, async (req, res) => {
    try {
      res.json(await updateCollection(req.params.id, req.body));
    } catch (error) {
      res.status(500).json({ error: 'Cập nhật dòng sản phẩm thất bại' });
    }
  });

  app.delete('/api/admin/collections/:id', authenticateToken, async (req, res) => {
    try {
      await deleteCollection(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Xóa dòng sản phẩm thất bại' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    // Catch-all route for SPA
    app.get('*', async (req, res) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Jade Elegance Server running on http://localhost:${PORT}`);
  });
}

startServer();
