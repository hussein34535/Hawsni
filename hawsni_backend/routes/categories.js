const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  console.log('GET /api/categories - Request received');
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    console.log(`GET /api/categories - Returning ${categories.length} categories`);
    res.json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/categories/:id
// @desc    Get category by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, category });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/categories
// @desc    Create category (Admin only)
// @access  Private/Admin
router.post('/', async (req, res) => {
  try {
    const { name, description, image } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    
    // Get the maximum sort_order value
    const { data: maxOrderData, error: maxOrderError } = await supabase
      .from('categories')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (maxOrderError) {
      throw maxOrderError;
    }
    
    const maxOrder = maxOrderData?.sort_order || 0;
    
    const { data: category, error } = await supabase
      .from('categories')
      .insert({ 
        name, 
        description: description || '',
        image: image || null,
        sort_order: maxOrder + 1
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.status(201).json({ success: true, category });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category (Admin only)
// @access  Private/Admin
router.put('/:id', async (req, res) => {
  try {
    const { name, description, image, is_active } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    
    const { data: category, error } = await supabase
      .from('categories')
      .update({
        name,
        description: description || '',
        image: image || null,
        is_active: is_active !== undefined ? is_active : true
      })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, category });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category (Admin only)
// @access  Private/Admin
router.delete('/:id', async (req, res) => {
  try {
    const { data: category, error } = await supabase
      .from('categories')
      .delete()
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;