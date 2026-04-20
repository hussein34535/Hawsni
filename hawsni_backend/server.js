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
const webhookRoutes = require('./routes/webhooks');
const chatRoutes = require('./routes/chat');

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

// Rate limiting configurations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Strict limit for auth/sensitive actions
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again after 15 minutes.' }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Balanced limit for general browsing
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please slow down.' }
});

// Apply rate limiters selectively
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/orders', authLimiter); // Protect checkout/order creation
app.use('/api/', generalLimiter); // Apply general limit to all other API routes

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Environment-aware origins
    const isProd = process.env.NODE_ENV === 'production';
    let allowedOrigins = [];

    if (isProd) {
      // Strict origins for production
      allowedOrigins = [
        'https://hwasibackend.vercel.app',
        'https://hawsni.com',
        'https://www.hawsni.com',
        'https://hwasi.com',
        'https://www.hwasi.com'
      ];
    } else {
      // Allow localhost ONLY in development
      allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
        'https://hwasibackend.vercel.app', // keep vercel even in dev for testing
        'https://hawsni.com'
      ];
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'CSRF-Token']
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb' }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// CSRF Protection specific for SSR (EJS) Admin UI
const csurf = require('csurf');
const csrfProtection = csurf({ 
    cookie: { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
    } 
});

// Import admin storage protection
const { adminProtect } = require('./middleware/adminAuth');

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
app.use('/api/webhooks', webhookRoutes);
app.use('/api/chat', chatRoutes);

// ──────────────────────────────────────────────
// Public Order Tracking Page
// ──────────────────────────────────────────────
app.get('/track-order', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.render('track-order', { order: null });

    const supabase = require('./config/supabase');
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, images))')
      .eq('id', id)
      .single();

    if (error || !order) {
      return res.render('track-order', { order: null });
    }

    return res.render('track-order', { order });
  } catch (err) {
    console.error('[Track Order] Error:', err);
    return res.render('track-order', { order: null });
  }
});

// SEO Routes (served at root)
app.use('/', seoRoutes);

// CSRF Token Injector Middleware
const injectCsrfToken = (req, res, next) => {
    if (typeof req.csrfToken === 'function') {
        res.locals.csrfToken = req.csrfToken();
    } else {
        res.locals.csrfToken = ''; // Fallback for routes without CSRF
    }
    next();
};

// Admin / Dashboard Routes - Apply Protection and Injection
app.use('/api/admin', adminProtect, csrfProtection, injectCsrfToken, adminRoutes);
app.use('/', csrfProtection, injectCsrfToken, adminRoutes);

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Server Error';

  console.error(`[${new Date().toISOString()}] Error ${status}: ${message}`);
  if (process.env.NODE_ENV !== 'production') {
      console.error(err.stack);
  }

  // Check if request expects HTML (browser/Admin UI)
  const isHtmlRequest = req.headers.accept && req.headers.accept.includes('text/html');

  if (isHtmlRequest) {
    try {
      return res.status(status).render('error', {
        message: message,
        error: process.env.NODE_ENV === 'development' ? err : { status }
      });
    } catch (renderError) {
      // Last resort if rendering fails
      return res.status(status).send(`<h1>Error ${status}</h1><p>${message}</p>`);
    }
  }

  // Default to JSON response for API or other requests
  res.status(status).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
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
