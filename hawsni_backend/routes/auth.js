const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase'); // استيراد إعدادات سوبابيس
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // لتشفير كلمة المرور يدوياً إذا لزم الأمر

// Generate JWT Token
const generateToken = (id, email, role) => {
  return jwt.sign({ id, email, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @route   POST /api/auth/register
// @desc    Register new user using Supabase Auth
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const { name, email, password } = req.body;

    // 1. تسجيل المستخدم في Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name, // حفظ الاسم في الميتا داتا
          role: 'user'
        }
      }
    });

    if (authError) {
      // لو المستخدم موجود بالفعل
      return res.status(400).json({ success: false, message: authError.message });
    }

    const user = authData.user;

    if (user) {
      // 2. إضافة المستخدم لجدول users في قاعدة البيانات (لربط البيانات)
      // ملاحظة: هذا يعتمد على الـ Schema الخاصة بك، قد تحتاج لتفعيل Trigger في Supabase
      // ولكن سنقوم بإضافته يدوياً للأمان
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          { id: user.id, name: name, role: 'user' }
        ]);

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // لا نوقف العملية هنا لأن الحساب الأساسي تم إنشاؤه
      }

      // إنشاء التوكن الخاص بتطبيقك (أو استخدام توكن سوبابيس)
      const token = generateToken(user.id, user.email, 'user');

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user.id,
          name: name,
          email: user.email,
          role: 'user'
        }
      });
    }

  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

// @route   POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').exists().withMessage('Password required')
], async (req, res) => {
  
  try {
    const { email, password } = req.body;

    // تسجيل الدخول عبر Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = data.user;
    
    // جلب بيانات إضافية من جدول users
    const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    const userName = userProfile ? userProfile.name : user.user_metadata.full_name;
    const userRole = userProfile ? userProfile.role : 'user';

    const token = generateToken(user.id, user.email, userRole);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: userName,
        email: user.email,
        role: userRole
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;