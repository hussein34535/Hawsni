const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const supabase = require('./config/supabase');
const upload = require('./middleware/upload');

// Load env vars
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const couponRoutes = require('./routes/coupons');
const wishlistRoutes = require('./routes/wishlist');
const reviewRoutes = require('./routes/reviews_supabase');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const bannerRoutes = require('./routes/banners');
const adminRoutes = require('./routes/admin'); // New admin routes
const vtoRoutes = require('./routes/vto'); // Virtual Try-On routes
// Import Controllers
const DashboardController = require('./controllers/admin/dashboardController');
const ProductController = require('./controllers/api/productController');
const CategoryController = require('./controllers/api/categoryController');
const OrderController = require('./controllers/api/orderController');

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
console.log('Debug: Initializing middleware...');
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Reflect origin or allow all for non-browser requests
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
console.log('Debug: Middleware initialized successfully.');

// API Routes
console.log('Debug: Registering API routes...');
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vto', vtoRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);

// Admin Routes (new layout system)
app.use('/', adminRoutes);

// Admin Dashboard Route (old - will be replaced)
app.get('/dashboard', DashboardController.getDashboard);

// Products Management (Admin)
app.get('/products', ProductController.renderProductsPage);
app.get('/products/new', ProductController.renderNewProductPage);
app.post('/products', upload.any(), ProductController.createProductAdmin);
app.get('/products/:id/edit', ProductController.renderEditProductPage);
app.post('/products/:id', upload.any(), ProductController.updateProductAdmin);
app.post('/products/:id/delete', ProductController.deleteProductAdmin);

// Image Management Routes
app.get('/products/:id/images', ProductController.renderImageManagementPage);
app.post('/products/:id/images', upload.array('images', 5), ProductController.uploadProductImages);
app.post('/products/:id/images/reorder', ProductController.reorderProductImages);
app.delete('/products/:id/images/:imageIndex', ProductController.deleteProductImage);

// Categories Management (Admin)
app.get('/categories', CategoryController.renderCategoriesPage);
app.get('/categories/:id/edit', CategoryController.renderEditPage);
app.post('/categories/reorder', CategoryController.reorderCategories);
app.post('/categories', upload.single('image'), CategoryController.createCategoryAdmin);
app.post('/categories/:id/delete', CategoryController.deleteCategoryAdmin);
app.post('/categories/:id', upload.single('image'), CategoryController.updateCategoryAdmin);

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

// Test Supabase connection
const testSupabaseConnection = async () => {
  console.log('Debug: Starting Supabase connection test...');
  try {
    const { data, error } = await supabase.from('products').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
      console.log('⚠️  Supabase connected but tables not created yet');
      console.log('📝 Run the SQL schema to create tables');
    } else {
      console.log('✅ Supabase connected successfully');
    }
  } catch (err) {
    console.log('⚠️  Supabase connection status unknown');
  }
  console.log('Debug: Supabase connection test completed.');
};

// Start server
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Bind to all interfaces

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/`);
  console.log(`🌐 Server accessible on network at http://${HOST}:${PORT}/`);
  console.log('Debug: Calling testSupabaseConnection...');
  testSupabaseConnection();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Debug: Unhandled Promise Rejection:', err.stack);
});

module.exports = app;