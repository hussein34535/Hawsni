const multer = require('multer');
const path = require('path');

// استخدام الذاكرة بدلاً من القرص (لأننا سنرفع الملفات لـ Supabase فوراً)
const storage = multer.memoryStorage();

// فلتر للتحقق من نوع الملف (صور فقط)
const fileFilter = (req, file, cb) => {
  console.log('🔍 Multer fileFilter checking:', file.originalname, file.mimetype);
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    console.error('❌ Multer rejected file:', file.originalname);
    cb(new Error('الصور فقط مسموح بها! (Only images are allowed)'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB max (Vercel limit is 4.5MB)
  fileFilter: fileFilter
});

module.exports = upload;