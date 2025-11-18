const multer = require('multer');
const path = require('path');

// استخدام الذاكرة بدلاً من القرص (لأننا سنرفع الملفات لـ Supabase فوراً)
const storage = multer.memoryStorage();

// فلتر للتحقق من نوع الملف (صور فقط)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('الصور فقط مسموح بها! (Only images are allowed)'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max size
  fileFilter: fileFilter
});

module.exports = upload;