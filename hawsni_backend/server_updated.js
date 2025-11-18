const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const supabase = require('./config/supabase');
const path = require('path');
const methodOverride = require('method-override');
const upload = require('./middleware/upload');
const uploadToSupabase = require('./utils/fileUpload');

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
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to log all requests to /categories/reorder
app.use('/categories/reorder', (req, res, next) => {
  console.log('=== REQUEST TO /categories/reorder ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Raw body (before parsing):', req.body);
  next();
});

// Admin Dashboard Routes
app.get('/dashboard', async (req, res) => {
  const { data: products } = await supabase.from('products').select('*').limit(10);
  const { data: categories } = await supabase.from('categories').select('*');
  const { data: orders } = await supabase.from('orders').select('*').limit(10);
  
  res.render('dashboard', { 
    products: products || [], 
    categories: categories || [],
    orders: orders || []
  });
});

// Products Management
app.get('/products', async (req, res) => {
  const { data: products } = await supabase.from('products').select('*, categories(name)');
  const { data: categories } = await supabase.from('categories').select('*');
  res.render('products', { products: products || [], categories: categories || [] });
});

app.get('/products/new', async (req, res) => {
  const { data: categories } = await supabase.from('categories').select('*');
  res.render('product-form', { product: null, categories: categories || [] });
});

app.post('/products', upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, discount, category_id, stock, is_featured } = req.body;
    
    // Get uploaded images URLs
    const imageUrls = req.files && req.files.length > 0
      ? req.files.map(file => `/uploads/${file.filename}`)
      : [];
    
    const { data, error } = await supabase.from('products').insert({
      name,
      description,
      price: parseFloat(price),
      discount: parseInt(discount) || 0,
      category_id: category_id || null,
      stock: parseInt(stock) || 0,
      is_featured: is_featured === 'on',
      images: imageUrls
    }).select();
    
    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(500).send(`خطأ في إضافة المنتج: ${error.message}`);
    }
    
    res.redirect('/products');
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).send(`خطأ في السيرفر: ${err.message}`);
  }
});

app.get('/products/:id/edit', async (req, res) => {
  const { data: product } = await supabase.from('products').select('*').eq('id', req.params.id).single();
  const { data: categories } = await supabase.from('categories').select('*');
  res.render('product-form', { product, categories: categories || [] });
});

app.post('/products/:id', upload.array('images', 5), async (req, res) => {
  const { name, description, price, discount, category_id, stock, is_featured } = req.body;
  
  // Get current product images
  const { data: currentProduct } = await supabase.from('products').select('images').eq('id', req.params.id).single();
  
  // Use new images if uploaded, otherwise keep existing
  const imageUrls = req.files && req.files.length > 0 
    ? req.files.map(file => `/uploads/${file.filename}`)
    : currentProduct?.images || [];
  
  await supabase.from('products').update({
    name,
    description,
    price: parseFloat(price),
    discount: parseInt(discount) || 0,
    category_id: category_id || null,
    stock: parseInt(stock) || 0,
    is_featured: is_featured === 'on',
    images: imageUrls
  }).eq('id', req.params.id);
  res.redirect('/products');
});

app.post('/products/:id/delete', async (req, res) => {
  await supabase.from('products').delete().eq('id', req.params.id);
  res.redirect('/products');
});

// Categories Management
app.get('/categories', async (req, res) => {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Supabase error:', error);
    return res.status(500).send(`خطأ في جلب التصنيفات: ${error.message}`);
  }
  
  res.render('categories', { categories: categories || [] });
});

app.get('/categories/:id/edit', async (req, res) => {
  const { data: category, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', req.params.id)
    .single();
  
  if (error) {
    console.error('❌ Supabase error:', error);
    return res.status(500).send(`خطأ في جلب التصنيف: ${error.message}`);
  }
  
  if (!category) {
    return res.status(404).send('التصنيف غير موجود');
  }
  
  res.render('category-edit', { category });
});

// Reorder categories
app.post('/categories/reorder', async (req, res) => {
  try {
    console.log('=== REORDER ROUTE CALLED ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Content type header:', req.headers['content-type']);
    console.log('Content length header:', req.headers['content-length']);
    console.log('Raw request body:', req.body);
    console.log('Stringified request body:', JSON.stringify(req.body, null, 2));
    console.log('Request body type:', typeof req.body);
    console.log('Request body keys:', Object.keys(req.body));
    
    // Check if body is empty
    if (!req.body || Object.keys(req.body).length === 0) {
      console.log('ERROR: Empty request body');
      return res.status(400).json({ success: false, message: 'Empty request body' });
    }
    
    const { categories } = req.body;
    
    console.log('Categories extracted:', categories);
    
    if (categories === undefined) {
      console.log('ERROR: Categories is undefined');
      return res.status(400).json({ success: false, message: 'Categories is undefined' });
    }
    
    if (categories === null) {
      console.log('ERROR: Categories is null');
      return res.status(400).json({ success: false, message: 'Categories is null' });
    }
    
    if (!categories) {
      console.log('ERROR: No categories in request body');
      return res.status(400).json({ success: false, message: 'No categories provided' });
    }
    
    if (!Array.isArray(categories)) {
      console.log('ERROR: Invalid categories data - not an array, type:', typeof categories);
      console.log('Categories value:', categories);
      return res.status(400).json({ success: false, message: 'Invalid categories data - must be an array' });
    }
    
    console.log('Categories to reorder:', categories);
    
    // Validate each category
    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      console.log(`Category ${i}:`, JSON.stringify(cat, null, 2));
      
      if (!cat) {
        console.log(`ERROR: Category ${i} is null or undefined`);
        return res.status(400).json({ success: false, message: `Category ${i} is invalid` });
      }
      
      if (!cat.id) {
        console.log(`ERROR: Category ${i} missing id`);
        return res.status(400).json({ success: false, message: `Category ${i} missing id` });
      }
      
      if (cat.sort_order === undefined) {
        console.log(`ERROR: Category ${i} missing sort_order`);
        return res.status(400).json({ success: false, message: `Category ${i} missing sort_order` });
      }
    }
    
    // Update sort orders
    const updates = categories.map(({ id, sort_order }) => {
      console.log('Updating category:', id, 'with sort_order:', sort_order);
      return supabase.from('categories').update({ sort_order: parseInt(sort_order) }).eq('id', id);
    });
    
    const results = await Promise.all(updates);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.log('ERRORS updating sort orders:', errors);
      throw new Error('Failed to update sort orders: ' + errors.map(e => e.error.message).join(', '));
    }
    
    console.log('Successfully updated categories');
    res.json({ success: true, categories });
  } catch (error) {
    console.error('ERROR in reorder route:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/categories', upload.single('image'), async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).send('اسم التصنيف مطلوب');
    }
    
    // الحصول على الترتيب
    const { data: maxOrderData, error: maxOrderError } = await supabase
      .from('categories')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (maxOrderError) {
      console.error('❌ Supabase error:', maxOrderError);
      return res.status(500).send(`خطأ في جلب الترتيب: ${maxOrderError.message}`);
    }
    
    const maxOrder = maxOrderData?.sort_order || 0;
    
    // رفع الصورة لـ Supabase
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToSupabase(req.file, 'categories');
    }
    
    const { data, error } = await supabase.from('categories').insert({ 
      name, 
      description: description || '',
      image: imageUrl, // الرابط السحابي
      sort_order: maxOrder + 1
    }).select().single();
    
    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(500).send(`خطأ في إضافة التصنيف: ${error.message}`);
    }
    
    console.log('✅ Category added successfully:', data);
    res.redirect('/categories');
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).send(`خطأ في السيرفر: ${err.message}`);
  }
});

app.post('/categories/:id/delete', async (req, res) => {
  const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
  
  if (error) {
    console.error('❌ Supabase error:', error);
    return res.status(500).send(`خطأ في حذف التص