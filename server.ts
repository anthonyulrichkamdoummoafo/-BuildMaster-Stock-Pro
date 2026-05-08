import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { authMiddleware, adminOnly } from './src/lib/authMiddleware';

const prisma = new PrismaClient();

// Optimization: Enable WAL mode for SQLite to prevent "Database is locked" errors
// and improve persistence reliability during power failures.
async function initDb() {
  await prisma.$executeRawUnsafe('PRAGMA journal_mode=WAL;');
}
initDb();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'buildmaster-super-secret-key';

app.use(express.json());

// Seed Admin User and Initial Data
async function seedData() {
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  if (adminCount === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'ADMIN',
      },
    });
    console.log('Default admin created: admin / admin123');

    // Create Categories
    const categories = ['Cement', 'Iron Rods', 'Nails', 'Paint', 'Electrical'];
    const catRefs = [];
    for (const name of categories) {
      const cat = await prisma.category.create({ data: { name, description: `Tools and materials for ${name.toLowerCase()}` } });
      catRefs.push(cat);
    }

    // Create Products
    const products = [
      { sku: 'CEM-425', name: 'Cement Dangote 42.5R', categoryId: catRefs[0].id, purchasePrice: 4200, sellingPrice: 5000, unitType: 'BAG', currentStock: 250 },
      { sku: 'IRO-12M', name: 'Iron Rod 12mm High Tensile', categoryId: catRefs[1].id, purchasePrice: 6500, sellingPrice: 7800, unitType: 'PIECE', currentStock: 120 },
      { sku: 'NAI-3IN', name: 'Steel Nails 3 inch (50kg)', categoryId: catRefs[2].id, purchasePrice: 35000, sellingPrice: 42000, unitType: 'BUNDLE', currentStock: 15 },
      { sku: 'PAI-WHT', name: 'Gloss Paint White 5L', categoryId: catRefs[3].id, purchasePrice: 12000, sellingPrice: 15500, unitType: 'PIECE', currentStock: 45 },
      { sku: 'ELE-CB1', name: 'Circuit Breaker 20A Single Phase', categoryId: catRefs[4].id, purchasePrice: 2500, sellingPrice: 4500, unitType: 'PIECE', currentStock: 80 },
    ];

    for (const p of products) {
      await prisma.product.create({ data: p });
    }
    console.log('Sample data seeded successfully.');
  }
}

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Inventory Routes
app.get('/api/products', authMiddleware, async (req, res) => {
  const { search, categoryId, page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: String(search) } },
      { sku: { contains: String(search) } },
    ];
  }
  if (categoryId) where.categoryId = String(categoryId);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      skip,
      take: Number(limit),
      orderBy: { name: 'asc' }
    }),
    prisma.product.count({ where })
  ]);

  res.json({ products, total, pages: Math.ceil(total / Number(limit)) });
});

app.post('/api/products', authMiddleware, adminOnly, async (req, res) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.json(product);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/categories', async (req, res) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});

// POS Routes
app.post('/api/sales', authMiddleware, async (req, res) => {
  const { items, customerId, userId, paymentMethod, totalAmount, netAmount, discount, tax, type } = req.body; // type: 'ENTRY' or 'EXIT'
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Validation & Inventory Locking Check
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { currentStock: true, name: true }
        });

        if (!product) throw new Error(`Product not found: ${item.productId}`);
        
        // Critical: Prevent negative stock on Exit moves
        if (type === 'EXIT' && product.currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.currentStock}`);
        }
      }

      // 2. Create Sale Record
      const sale = await tx.sale.create({
        data: {
          invoiceNumber: `${type === 'ENTRY' ? 'ENT' : 'INV'}-${Date.now()}`,
          userId,
          customerId,
          totalAmount,
          netAmount,
          discount,
          tax,
          paymentMethod,
          status: type === 'ENTRY' ? 'RESTOCK' : 'COMPLETED',
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              total: item.quantity * item.price
            }))
          }
        }
      });

      // 3. Atomic Stock Update
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              [type === 'ENTRY' ? 'increment' : 'decrement']: item.quantity
            }
          }
        });

        // 4. Record History
        await tx.stockHistory.create({
          data: {
            productId: item.productId,
            quantity: type === 'ENTRY' ? item.quantity : -item.quantity,
            type: type === 'ENTRY' ? 'ADDITION' : 'REDUCTION',
            reason: `${type === 'ENTRY' ? 'Restock' : 'Sale'} ${sale.invoiceNumber}`,
            performedBy: userId
          }
        });
      }

      return sale;
    }, {
      timeout: 10000 // Increase timeout for complex transactions
    });

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Dashboard Statistics
app.get('/api/dashboard/stats', async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalSales, lowStock, totalProducts, todayRevenue] = await Promise.all([
    prisma.sale.count(),
    prisma.product.count({ where: { currentStock: { lte: prisma.product.fields.minStockLevel } } }),
    prisma.product.count(),
    prisma.sale.aggregate({
      _sum: { netAmount: true },
      where: { createdAt: { gte: today } }
    })
  ]);

  res.json({
    totalSales,
    lowStock,
    totalProducts,
    todayRevenue: todayRevenue._sum.netAmount || 0
  });
});

// Settings Routes
app.get('/api/settings', authMiddleware, async (req, res) => {
  const settings = await prisma.setting.findMany();
  res.json(settings.reduce((acc: any, s) => ({ ...acc, [s.key]: s.value }), {}));
});

app.post('/api/settings', authMiddleware, adminOnly, async (req, res) => {
  const settings = req.body;
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    });
  }
  res.json({ status: 'ok' });
});

async function startServer() {
  await seedData();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BuildMaster Server running on http://localhost:${PORT}`);
  });
}

startServer();
