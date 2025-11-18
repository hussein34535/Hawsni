const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const upload = require('../middleware/upload'); // استيراد الميدلوير
const uploadToSupabase = require('../utils/fileUpload'); // استيراد دالة الرفع

// @route   GET /api/categories
router.get('/', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    
    res.json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/categories
// @desc    Create category (Admin only)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    
    // 1. رفع الصورة إن وجدت
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToSupabase(req.file, 'categories');
    }

    // 2. تحديد الترتيب
    const { data: maxOrderData } = await supabase
      .from('categories')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const maxOrder = maxOrderData?.sort_order || 0;
    
    // 3. الحفظ في قاعدة البيانات
    const { data: category, error } = await supabase
      .from('categories')
      .insert({ 
        name, 
        description: description || '',
        image: imageUrl, // رابط Supabase
        sort_order: maxOrder + 1
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ success: true, category });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/categories/:id
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, description, is_active } = req.body;
    
    // تجهيز البيانات للتحديث
    const updateData = {
      name,
      description: description || '',
      is_active: is_active !== undefined ? is_active : true
    };

    // تحديث الصورة فقط لو تم رفع ملف جديد
    if (req.file) {
      updateData.image = await uploadToSupabase(req.file, 'categories');
    }
    
    const { data: category, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, category });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;

    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;