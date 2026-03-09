const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cookies = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const supabase = require('./config/supabase');
const upload = require('./middleware/upload');
const methodOverride = require('method-override');

// Load env vars
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const couponRoutes = require('./routes/coupons');
const wishlistRoutes = require('./routes/wishlist');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const bannerRoutes = require('./routes/banners');
const seoRoutes = require('./routes/seo');
const vtoRoutes = require('./routes/vto');
const adminRoutes = require('./routes/admin');
const shippingRoutes = require('./routes/shipping');
const publicSettingsRoutes = require('./routes/publicSettings');
const seoMiddleware = require('./middleware/seoMiddleware');
const cloudinaryRoutes = require('./routes/cloudinary');

const app = express();

// Required for rate limiting on Vercel
app.set('trust proxy', 1);

// SEO Middleware for bot/crawler interception
app.use(seoMiddleware);
app.use(cookies());

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for SSR/EJS compatibility, can be tuned later
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// Apply rate limiter to all api routes
app.use('/api/', limiter);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'https://hwasibackend.vercel.app',
    'https://hawsni.com',
    'https://www.hawsni.com',
    'https://hwasi.com',
    'https://www.hwasi.com'
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb' }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// General API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/vto', vtoRoutes);
app.use('/api/settings', publicSettingsRoutes);
app.use('/api/cloudinary', cloudinaryRoutes);

// SEO Routes (served at root)
app.use('/', seoRoutes);

// Admin / Dashboard Routes
app.use('/api/admin', adminRoutes);
app.use('/', adminRoutes);

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// Start server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;
