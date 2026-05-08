import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const prisma = new PrismaClient();
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
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Inventory Routes
app.get('/api/products', async (req, res) => {
  const products = await prisma.product.findMany({ include: { category: true } });
  res.json(products);
});

app.post('/api/products', async (req, res) => {
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
app.post('/api/sales', async (req, res) => {
  const { items, customerId, userId, paymentMethod, totalAmount, netAmount, discount, tax } = req.body;
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Sale
      const sale = await tx.sale.create({
        data: {
          invoiceNumber: `INV-${Date.now()}`,
          userId,
          customerId,
          totalAmount,
          netAmount,
          discount,
          tax,
          paymentMethod,
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

      // 2. Update Stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity
            }
          }
        });

        // 3. Record Stock History
        await tx.stockHistory.create({
          data: {
            productId: item.productId,
            quantity: -item.quantity,
            type: 'REDUCTION',
            reason: `Sale ${sale.invoiceNumber}`,
            performedBy: userId
          }
        });
      }

      return sale;
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
