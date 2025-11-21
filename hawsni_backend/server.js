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
const reviewRoutes = require('./routes/reviews_supabase'); // Use Supabase reviews route
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');

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
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));





// Admin Dashboard Route
app.get('/dashboard', DashboardController.getDashboard);

// Products Management
app.get('/products', ProductController.renderProductsPage);
app.get('/products/new', ProductController.renderNewProductPage);
app.post('/products', upload.array('images', 5), ProductController.createProductAdmin);
app.get('/products/:id/edit', ProductController.renderEditProductPage);
app.post('/products/:id', upload.array('images', 5), ProductController.updateProductAdmin);
app.post('/products/:id/delete', ProductController.deleteProductAdmin);

// Categories Management
app.get('/categories', CategoryController.renderCategoriesPage);
app.get('/categories/:id/edit', CategoryController.renderEditPage);
app.post('/categories/reorder', CategoryController.reorderCategories);
app.post('/categories', upload.single('image'), CategoryController.createCategoryAdmin);
app.post('/categories/:id/delete', CategoryController.deleteCategoryAdmin);
app.post('/categories/:id', upload.single('image'), CategoryController.updateCategoryAdmin);

// Orders Management
app.get('/orders', OrderController.renderOrdersPage);
app.post('/orders/:id/status', OrderController.updateStatusAdmin);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);

// Redirect root to dashboard
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
};

// Start server
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Bind to all interfaces

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/`);
  console.log(`🌐 Server accessible on network at http://${HOST}:${PORT}/`);
  testSupabaseConnection();
});

module.exports = app;