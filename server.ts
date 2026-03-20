import express from 'express';
import { createServer as createViteServer } from 'vite';
import { PRODUCTS } from './src/constants';
import db, { seedProducts, getAllProducts, createOrder, addProduct, updateProduct, deleteProduct, getAllOrders, updateOrderStatus, deleteOrder, getAllVouchers, addVoucher, updateVoucher, deleteVoucher, getVoucherByCode, createUser, getUserByEmail, getUserById, updateUserProfile, getUserOrders, getAllPromotions, addPromotion, updatePromotion, deletePromotion, hasUserUsedVoucher, getUserTotalSpent, logSearchKeyword, getSearchAnalytics, clearSearchAnalytics, getAllBlogs, getBlogBySlug, getBlogById, addBlog, updateBlog, deleteBlog, createEmailVerification, verifyEmailCode, markUserVerified, createPasswordResetToken, verifyPasswordResetToken, updatePassword, saveOrderFeedback, getOrderFeedback, getAdminByEmail, getAdminById, getAllAdmins, addAdmin, updateAdminCredentials, updateAdminPassword, getBankSettings, updateBankSettings, getSocialSettings, updateSocialSettings, getFeaturedBlogs, getRegistrationVoucherDiscount, updateRegistrationVoucherDiscount, getAllAvailableVouchersForUser, getAllCollections, addCollection, updateCollection, deleteCollection } from './src/db';
import { sendVerificationEmail, sendPasswordResetEmail, sendFeedbackRequestEmail, sendWelcomeVoucherEmail } from './email';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

import { translate } from 'google-translate-api-x';

dotenv.config();

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

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

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
  seedProducts(PRODUCTS);

  // API Routes
  app.get('/api/products', (req, res) => {
    try {
      const products = getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.get('/api/promotions', (req, res) => {
    try {
      const promotions = getAllPromotions();
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch promotions' });
    }
  });

  app.get('/api/settings/bank', (req, res) => {
    try {
      const settings = getBankSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch bank settings' });
    }
  });

  app.get('/api/settings/social', (req, res) => {
    try {
      const settings = getSocialSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch social settings' });
    }
  });


  app.post('/api/orders', (req, res) => {
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
        const voucher = getVoucherByCode(voucher_code);
        if (!voucher) {
          return res.status(400).json({ error: 'Voucher is invalid or inactive' });
        }
        if (voucher.usage_limit && voucher.usage_count >= voucher.usage_limit) {
          return res.status(400).json({ error: 'Voucher usage limit reached' });
        }
        if (hasUserUsedVoucher(orderEmail, voucher_code)) {
          return res.status(400).json({ error: 'You have already used this voucher' });
        }
        const totalSpent = getUserTotalSpent(orderEmail);
        if (voucher.min_user_spending && totalSpent < voucher.min_user_spending) {
          return res.status(400).json({ error: `You must spend at least ${voucher.min_user_spending.toLocaleString()} VND to use this voucher` });
        }
      }

      const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const result = createOrder({
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
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // Auth Routes
  app.post('/api/auth/request-verification', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email is required' });

      const existingUser = getUserByEmail(email);
      if (existingUser) return res.status(400).json({ error: 'Email already registered' });

      const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
      const expiresAt = new Date(Date.now() + 15 * 60000); // 15 mins
      createEmailVerification(email, code, expiresAt);

      await sendVerificationEmail(email, code);
      res.json({ success: true, message: 'Verification code sent' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send verification code' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name, code } = req.body;

      if (!email || !password || !code) {
        return res.status(400).json({ error: 'Email, password, and verification code are required' });
      }

      if (!validatePassword(password)) {
        return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa và 1 chữ số.' });
      }

      const existingUser = getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      if (!verifyEmailCode(email, code)) {
        return res.status(400).json({ error: 'Invalid or expired verification code' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;

      createUser({ id: userId, email, password: hashedPassword, name });
      markUserVerified(email);

      // Issue Welcome Voucher
      try {
        const regConfig = getRegistrationVoucherDiscount();
        const voucherCode = `WELCOME-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const voucherId = `reg-vouch-${Date.now()}`;

        addVoucher({
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
      res.status(500).json({ error: 'Failed to register user' });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      const user = getUserByEmail(email);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + 60 * 60000); // 1 hr
      createPasswordResetToken(email, token, expiresAt);

      const appDomain = process.env.APP_URL || 'http://localhost:5173';
      const resetLink = `${appDomain}/?view=reset-password&token=${token}`;
      await sendPasswordResetEmail(email, resetLink);

      res.json({ success: true, message: 'Password reset link sent' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process request' });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });

      if (!validatePassword(newPassword)) {
        return res.status(400).json({ error: 'Mật khẩu mới không hợp lệ.' });
      }

      const email = verifyPasswordResetToken(token);
      if (!email) return res.status(400).json({ error: 'Invalid or expired token' });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updatePassword(email, hashedPassword);

      res.json({ success: true, message: 'Password has been reset' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
      res.status(500).json({ error: 'Failed to login' });
    }
  });

  // User Profile Routes
  app.get('/api/users/profile', authenticateToken, (req: any, res: any) => {
    try {
      let user = getUserById(req.user.id); if (!user && req.user.email) { user = (db.prepare('SELECT * FROM users WHERE email = ?').all(req.user.email) as any[])[0]; } if (!user) return res.status(404).json({ error: 'User not found (Token ID: ' + req.user.id + ', Token Email: ' + req.user.email + ')' });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  app.put('/api/users/profile', authenticateToken, (req: any, res: any) => {
    try {
      const { name, phone, address } = req.body;
      if (!validatePhone(phone)) {
        return res.status(400).json({ error: 'Số điện thoại không hợp lệ.' });
      }
      if (!validateAddress(address)) {
        return res.status(400).json({ error: 'Địa chỉ không hợp lệ.' });
      }
      updateUserProfile(req.user.id, { name, phone, address });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile' });
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

      let user = getUserById(req.user.id);
      if (!user && req.user.email) {
        user = (db.prepare('SELECT * FROM users WHERE email = ?').all(req.user.email) as any[])[0];
      }
      if (!user) {
        return res.status(404).json({ error: `User not found (ID: ${req.user.id}, Email: ${req.user.email})` });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updatePassword(user.email, hashedPassword);

      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update password' });
    }
  });

  app.post('/api/auth/profile/forgot-password', authenticateToken, async (req: any, res: any) => {
    try {
      let user = getUserById(req.user.id);
      if (!user && req.user.email) {
        user = (db.prepare('SELECT * FROM users WHERE email = ?').all(req.user.email) as any[])[0];
      }
      if (!user) {
        return res.status(404).json({ error: `User not found (ID: ${req.user.id}, Email: ${req.user.email})` });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
      const expiresAt = new Date(Date.now() + 15 * 60000); // 15 mins
      createEmailVerification(user.email, code, expiresAt);

      await sendVerificationEmail(user.email, code);
      res.json({ success: true, message: 'Verification code sent to your email' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send verification code' });
    }
  });

  app.post('/api/auth/profile/reset-password-with-code', authenticateToken, async (req: any, res: any) => {
    try {
      const { code, newPassword } = req.body;
      if (!code || !newPassword) {
        return res.status(400).json({ error: 'Code and new password are required' });
      }

      if (!validatePassword(newPassword)) {
        return res.status(400).json({ error: 'Mật khẩu mới không hợp lệ.' });
      }

      let user = getUserById(req.user.id);
      if (!user && req.user.email) {
        user = (db.prepare('SELECT * FROM users WHERE email = ?').all(req.user.email) as any[])[0];
      }
      if (!user) {
        return res.status(404).json({ error: `User not found (ID: ${req.user.id}, Email: ${req.user.email})` });
      }

      if (!verifyEmailCode(user.email, code)) {
        return res.status(400).json({ error: 'Mã xác nhận không chính xác hoặc đã hết hạn.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updatePassword(user.email, hashedPassword);

      res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  app.get('/api/users/orders', authenticateToken, (req: any, res: any) => {
    try {
      let user = getUserById(req.user.id); if (!user && req.user.email) { user = (db.prepare('SELECT * FROM users WHERE email = ?').all(req.user.email) as any[])[0]; } if (!user) return res.status(404).json({ error: 'User not found (Token ID: ' + req.user.id + ', Token Email: ' + req.user.email + ')' });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const orders = getUserOrders(user.email);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // Feedback Routes
  app.post('/api/orders/:id/feedback', (req, res) => {
    try {
      const { rating, comment } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Valid rating between 1 and 5 is required' });
      }
      const existing = getOrderFeedback(req.params.id);
      if (existing) {
        return res.status(400).json({ error: 'Feedback already submitted for this order' });
      }
      const result = saveOrderFeedback(req.params.id, rating, comment || '');
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to save feedback' });
    }
  });

  app.get('/api/admin/orders/:id/feedback', (req, res) => {
    try {
      const feedback = getOrderFeedback(req.params.id);
      res.json(feedback || { success: false, message: 'No feedback found' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch feedback' });
    }
  });

  // Admin Routes
  app.post('/api/admin/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const admin = getAdminByEmail(email);

      if (!admin) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }

      const validPassword = await bcrypt.compare(password, admin.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }

      // We sign the token with an explicit role to distinguish it from a normal user
      const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, admin: { id: admin.id, email: admin.email } });
    } catch (error) {
      res.status(500).json({ error: 'Failed to login admin' });
    }
  });

  app.put('/api/admin/settings', authenticateToken, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden. Admin role required.' });
      }

      const { newEmail, currentPassword, newPassword } = req.body;
      if (!newEmail || !currentPassword) {
        return res.status(400).json({ error: 'Email and current password are required.' });
      }

      const admin = getAdminById(req.user.id);
      if (!admin) return res.status(404).json({ error: 'Admin not found.' });

      const validPassword = await bcrypt.compare(currentPassword, admin.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }

      if (newPassword) {
        if (!validatePassword(newPassword)) {
          return res.status(400).json({ error: 'Mật khẩu mới không đủ độ mạnh.' });
        }
      }

      // If they provided a new password, hash it. Otherwise, keep the old one.
      const passwordToSave = newPassword ? await bcrypt.hash(newPassword, 10) : admin.password;

      // Update the DB
      updateAdminCredentials(admin.id, newEmail, passwordToSave);

      // We issue a new token in case the email is stored inside it
      const newToken = jwt.sign({ id: admin.id, email: newEmail, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });

      res.json({ success: true, token: newToken, admin: { id: admin.id, email: newEmail } });
    } catch (error) {
      if ((error as any).code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({ error: 'Email already extremely exists.' });
      }
      res.status(500).json({ error: 'Failed to update admin settings' });
    }
  });

  app.put('/api/admin/settings/bank', authenticateToken, uploadBank.single('bankQR'), (req: any, res: any) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden. Admin role required.' });
      }

      const { bankName, bankOwner, bankNumber, bankQR_url } = req.body;
      let bankQR = bankQR_url || '';

      if (req.file) {
        // Fetch current settings to get the old image path
        const currentSettings = getBankSettings();
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

      const result = updateBankSettings({ bankName, bankOwner, bankNumber, bankQR });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update bank settings' });
    }
  });

  app.put('/api/admin/settings/social', authenticateToken, (req: any, res: any) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden. Admin role required.' });
      }

      const { facebook, tiktok, instagram, telegram } = req.body;
      const result = updateSocialSettings({ facebook, tiktok, instagram, telegram });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update social settings' });
    }
  });


  app.get('/api/admin/admins', authenticateToken, (req: any, res: any) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      res.json(getAllAdmins());
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch admins' });
    }
  });

  app.post('/api/admin/admins', authenticateToken, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

      if (!validatePassword(password)) {
        return res.status(400).json({ error: 'Mật khẩu không đạt yêu cầu.' });
      }

      const existing = getAdminByEmail(email);
      if (existing) return res.status(400).json({ error: 'Admin email already registered' });

      const hashedPassword = await bcrypt.hash(password, 10);
      addAdmin(email, hashedPassword);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create admin' });
    }
  });

  app.post('/api/admin/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      const admin = getAdminByEmail(email);
      if (!admin) {
        // Obfuscate to prevent enumeration
        return res.json({ success: true, message: 'Reset link sent' });
      }

      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + 60 * 60000); // 1 hr

      createPasswordResetToken(email, token, expiresAt);

      const appDomain = process.env.APP_URL || 'http://localhost:3000';
      const resetLink = `${appDomain}/?view=admin-reset-password&token=${token}`;

      await sendPasswordResetEmail(email, resetLink);

      res.json({ success: true, message: 'Reset link sent' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process request' });
    }
  });

  app.post('/api/admin/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });

      if (!validatePassword(newPassword)) {
        return res.status(400).json({ error: 'Mật khẩu mới không đạt yêu cầu.' });
      }

      const email = verifyPasswordResetToken(token);
      if (!email) return res.status(400).json({ error: 'Invalid or expired reset token' });

      const admin = getAdminByEmail(email);
      if (!admin) return res.status(400).json({ error: 'Admin account not found' });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateAdminPassword(email, hashedPassword);

      res.json({ success: true, message: 'Admin password reset successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reset admin password' });
    }
  });

  app.post('/api/admin/products', (req, res) => {
    try {
      const productData = req.body;
      if (productData.images && productData.images.length > 0) {
        productData.images = processProductImages(productData.id, productData.images);
        productData.image = productData.images[0];
      }
      const result = addProduct(productData);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add product' });
    }
  });

  app.put('/api/admin/products/:id', (req, res) => {
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
      const result = updateProduct(req.params.id, productData);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.post('/api/admin/translate', async (req, res) => {
    try {
      const { text, from = 'vi', to = 'en' } = req.body;
      if (!text) return res.status(400).json({ error: 'No text provided' });

      const result = await translate(text, { from, to }) as any;
      res.json({ translatedText: result.text });
    } catch (error) {
      console.error('Translation error:', error);
      res.status(500).json({ error: 'Translation failed' });
    }
  });

  app.delete('/api/admin/products/:id', (req, res) => {
    try {
      deleteProductFolder(req.params.id);
      const result = deleteProduct(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  app.get('/api/admin/orders', (req, res) => {
    try {
      const orders = getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  app.put('/api/admin/orders/:id/status', (req, res) => {
    try {
      const result = updateOrderStatus(req.params.id, req.body.status);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  app.delete('/api/admin/orders/:id', (req, res) => {
    try {
      const result = deleteOrder(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete order' });
    }
  });

  app.get('/api/admin/vouchers', (req, res) => {
    try {
      const vouchers = getAllVouchers();
      res.json(vouchers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch vouchers' });
    }
  });

  app.post('/api/admin/vouchers', (req, res) => {
    try {
      const result = addVoucher(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add voucher' });
    }
  });

  app.put('/api/admin/vouchers/:id', (req, res) => {
    try {
      const result = updateVoucher(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update voucher' });
    }
  });

  app.get('/api/admin/settings/registration-discount', authenticateToken, (req: any, res: any) => {
    try {
      res.json(getRegistrationVoucherDiscount());
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch registration discount' });
    }
  });

  app.put('/api/admin/settings/registration-discount', authenticateToken, (req: any, res: any) => {
    try {
      const { discount, type } = req.body;
      const result = updateRegistrationVoucherDiscount(parseFloat(discount), type || 'percent');
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update registration discount' });
    }
  });

  app.delete('/api/admin/vouchers/:id', (req, res) => {
    try {
      const result = deleteVoucher(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete voucher' });
    }
  });

  app.get('/api/vouchers/:code', (req, res) => {
    try {
      const voucher = getVoucherByCode(req.params.code);
      if (voucher) {
        res.json(voucher);
      } else {
        res.status(404).json({ error: 'Voucher not found or inactive' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch voucher' });
    }
  });

  app.post('/api/vouchers/validate', (req, res) => {
    try {
      const { code, email } = req.body;
      if (!code || !email) {
        return res.status(400).json({ error: 'Voucher code and email are required' });
      }

      const voucher = getVoucherByCode(code);
      if (!voucher) {
        return res.status(404).json({ error: 'Voucher not found or inactive' });
      }

      // Check global limit
      if (voucher.usage_limit && voucher.usage_count >= voucher.usage_limit) {
        return res.status(400).json({ error: 'Voucher usage limit reached' });
      }

      // Check unique usage per user
      if (hasUserUsedVoucher(email, code)) {
        return res.status(400).json({ error: 'You have already used this voucher' });
      }

      // Check if voucher is tied to this user
      if (voucher.user_email && voucher.user_email !== email) {
        return res.status(403).json({ error: 'This voucher is not valid for your account.' });
      }

      // Check minimum spending eligibility
      const totalSpent = getUserTotalSpent(email);
      if (voucher.min_user_spending && totalSpent < voucher.min_user_spending) {
        return res.status(400).json({ error: `You must spend at least ${voucher.min_user_spending.toLocaleString()} VND to use this voucher` });
      }

      // If all checks pass
      res.json({ success: true, voucher });
    } catch (error) {
      res.status(500).json({ error: 'Failed to validate voucher' });
    }
  });

  app.get('/api/vouchers/available', (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) {
        return res.status(400).json({ error: 'Email query parameter is required' });
      }

      const allVouchers = getAllAvailableVouchersForUser(email);
      const availableVouchers = allVouchers.filter(v => {
        if (!v.is_active) return false;
        if (v.usage_limit && v.usage_count >= v.usage_limit) return false;
        if (hasUserUsedVoucher(email, v.code)) return false;
        if (v.is_registration) return false;
        return true;
      });

      res.json(availableVouchers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch available vouchers' });
    }
  });

  // Admin Promotions Routes
  app.get('/api/admin/promotions', (req, res) => {
    try {
      const promotions = getAllPromotions();
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch promotions' });
    }
  });

  app.post('/api/admin/promotions', (req, res) => {
    try {
      const result = addPromotion(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add promotion' });
    }
  });

  app.put('/api/admin/promotions/:id', (req, res) => {
    try {
      const result = updatePromotion(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update promotion' });
    }
  });

  app.delete('/api/admin/promotions/:id', (req, res) => {
    try {
      const result = deletePromotion(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete promotion' });
    }
  });

  // Blog Routes
  // IMPORTANT: /api/blogs/featured must be registered BEFORE /api/blogs/:slug
  app.get('/api/blogs/featured', (req, res) => {
    try {
      const blogs = getFeaturedBlogs();
      res.json(blogs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch featured blogs' });
    }
  });

  app.get('/api/blogs', (req, res) => {
    try {
      const blogs = getAllBlogs(false); // only published
      res.json(blogs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch blogs' });
    }
  });

  app.get('/api/blogs/:slug', (req, res) => {
    try {
      const blog = getBlogBySlug(req.params.slug);
      if (blog && blog.is_published) {
        res.json(blog);
      } else {
        res.status(404).json({ error: 'Blog not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch blog detail' });
    }
  });

  app.get('/api/admin/blogs', (req, res) => {
    try {
      const blogs = getAllBlogs(true); // all blogs
      res.json(blogs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch admin blogs' });
    }
  });

  app.post('/api/admin/blogs', uploadBlog.single('image'), (req, res) => {
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
      const result = addBlog(blogData);
      res.json(result);
    } catch (error) {
      console.error('Error adding blog:', error);
      res.status(500).json({ error: 'Failed to add blog' });
    }
  });

  app.put('/api/admin/blogs/:id', uploadBlog.single('image'), (req, res) => {
    try {
      const blogData = req.body;

      // Fetch the existing blog to get its current image path
      const oldBlog = getBlogById(req.params.id);
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

      const result = updateBlog(req.params.id, blogData);
      res.json(result);
    } catch (error) {
      console.error('Error updating blog:', error);
      res.status(500).json({ error: 'Failed to update blog' });
    }
  });

  app.delete('/api/admin/blogs/:id', (req, res) => {
    try {
      // Get the current blog to find the image path before deleting it
      const blog = getBlogById(req.params.id);
      const blogImage = blog?.image;

      const result = deleteBlog(req.params.id);

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
      res.status(500).json({ error: 'Failed to delete blog' });
    }
  });

  // Search Analytics Routes
  app.post('/api/search/log', (req, res) => {
    try {
      const { keyword } = req.body;
      const result = logSearchKeyword(keyword);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to log search keyword' });
    }
  });

  app.get('/api/admin/search-analytics', (req, res) => {
    try {
      const result = getSearchAnalytics();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch search analytics' });
    }
  });

  app.delete('/api/admin/search-analytics', (req, res) => {
    try {
      const result = clearSearchAnalytics();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear search analytics' });
    }
  });

  // Public settings endpoint for social links
  app.get('/api/settings/social', (req, res) => {
    try {
      res.json(getSocialSettings());
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch social settings' });
    }
  });

  // Collections Routes
  app.get('/api/collections', (req, res) => {
    try {
      res.json(getAllCollections());
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch collections' });
    }
  });

  app.post('/api/admin/collections', authenticateToken, (req, res) => {
    try {
      res.json(addCollection(req.body));
    } catch (error) {
      res.status(500).json({ error: 'Failed to add collection' });
    }
  });

  app.put('/api/admin/collections/:id', authenticateToken, (req, res) => {
    try {
      res.json(updateCollection(req.params.id, req.body));
    } catch (error) {
      res.status(500).json({ error: 'Failed to update collection' });
    }
  });

  app.delete('/api/admin/collections/:id', authenticateToken, (req, res) => {
    try {
      deleteCollection(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete collection' });
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
    app.get('*', (req, res) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Jade Elegance Server running on http://localhost:${PORT}`);
  });
}

startServer();
