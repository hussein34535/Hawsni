const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
// const Product = require('../models/Product'); // Not used with Supabase
// const { protect, authorize } = require('../middleware/auth'); // Will implement later

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  console.log('GET /api/products - Request received');
  try {
    const { category, search, minPrice, maxPrice, sort } = req.query;
    
    // Build query for Supabase
    let query = supabase
      .from('products')
      .select('*, categories(name)')
      .eq('is_active', true);
    
    // Apply filters
    if (category) {
      query = query.eq('category_id', category);
    }
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }
    
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }
    
    // Apply sorting
    if (sort) {
      const sortBy = sort === 'price_asc' ? 'price' : sort === 'price_desc' ? 'price.desc' : 'created_at.desc';
      query = query.order(sortBy);
    }
    
    const { data: products, error } = await query;
    
    if (error) {
      throw error;
    }
    
    console.log(`GET /api/products - Returning ${products.length} products`);
    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('is_featured', true)
      .eq('is_active', true)
      .limit(10);
    
    if (error) {
      throw error;
    }

    res.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('id', req.params.id)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/products
// @desc    Create product (Admin only)
// @access  Private/Admin
router.post('/', async (req, res) => {
  try {
    // Parse sizes and colors from request body
    let sizes = [];
    let colors = [];
    
    if (req.body.sizes) {
      if (Array.isArray(req.body.sizes)) {
        sizes = req.body.sizes;
      } else if (typeof req.body.sizes === 'string') {
        sizes = req.body.sizes.split(',').map(size => size.trim());
      }
    }
    
    if (req.body.colors) {
      if (Array.isArray(req.body.colors)) {
        colors = req.body.colors;
      } else if (typeof req.body.colors === 'string') {
        colors = req.body.colors.split(',').map(color => color.trim());
      }
    }
    
    const productData = {
      ...req.body,
      price: parseFloat(req.body.price),
      discount: parseInt(req.body.discount) || 0,
      stock: parseInt(req.body.stock) || 0,
      is_featured: req.body.is_featured === 'on' || req.body.is_featured === true,
      sizes: sizes,
      colors: colors
    };
    
    const { data: product, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product (Admin only)
// @access  Private/Admin
router.put('/:id', async (req, res) => {
  try {
    // Parse sizes and colors from request body
    let sizes = [];
    let colors = [];
    
    if (req.body.sizes) {
      if (Array.isArray(req.body.sizes)) {
        sizes = req.body.sizes;
      } else if (typeof req.body.sizes === 'string') {
        sizes = req.body.sizes.split(',').map(size => size.trim());
      }
    }
    
    if (req.body.colors) {
      if (Array.isArray(req.body.colors)) {
        colors = req.body.colors;
      } else if (typeof req.body.colors === 'string') {
        colors = req.body.colors.split(',').map(color => color.trim());
      }
    }
    
    const productData = {
      ...req.body,
      price: parseFloat(req.body.price),
      discount: parseInt(req.body.discount) || 0,
      stock: parseInt(req.body.stock) || 0,
      is_featured: req.body.is_featured === 'on' || req.body.is_featured === true,
      sizes: sizes,
      colors: colors
    };
    
    const { data: product, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (Admin only)
// @access  Private/Admin
router.delete('/:id', async (req, res) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
