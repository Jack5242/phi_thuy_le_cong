import express from 'express';
import { createServer as createViteServer } from 'vite';
import { PRODUCTS } from './src/constants';
import { seedProducts, getAllProducts, createOrder, addProduct, updateProduct, deleteProduct, getAllOrders, updateOrderStatus, deleteOrder, getAllVouchers, addVoucher, updateVoucher, deleteVoucher, getVoucherByCode, createUser, getUserByEmail, getUserById, updateUserProfile, getUserOrders, getAllPromotions, addPromotion, updatePromotion, deletePromotion } from './src/db';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-123';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'products');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

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

  app.post('/api/orders', (req, res) => {
    try {
      const { email, name, phone, address, notes, total, items, receipt } = req.body;
      const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const result = createOrder({ id: orderId, email: email || 'guest@example.com', name, phone, address, notes, total, items, receipt });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // Auth Routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const existingUser = getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
      
      createUser({ id: userId, email, password: hashedPassword, name });
      
      const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: userId, email, name } });
    } catch (error) {
      res.status(500).json({ error: 'Failed to register user' });
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
      const user = getUserById(req.user.id);
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
      updateUserProfile(req.user.id, { name, phone, address });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  app.get('/api/users/orders', authenticateToken, (req: any, res: any) => {
    try {
      const user = getUserById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const orders = getUserOrders(user.email);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // Admin Routes
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
