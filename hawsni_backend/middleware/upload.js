const multer = require('multer');
const path = require('path');

// استخدام الذاكرة بدلاً من القرص (لأننا سنرفع الملفات لـ Supabase فوراً)
const storage = multer.memoryStorage();

// فلتر للتحقق من نوع الملف (صور فقط)
const fileFilter = (req, file, cb) => {
  console.log('🔍 Multer fileFilter checking:', file.originalname, file.mimetype);
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg|mp4|webm|mov|avi/i;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('الصور والفيديوهات فقط مسموح بها! (Only images and videos are allowed)'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 4.5 * 1024 * 1024 }, // 4.5MB max for Vercel Serverless Limits
  fileFilter: fileFilter
});

module.exports = upload;