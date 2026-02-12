const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('Cloudinary Config:', {
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY ? '***' : 'MISSING',
  api_secret: process.env.CLOUDINARY_SECRET ? '***' : 'MISSING'
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

/**
 * رفع ملف إلى Cloudinary Storage
 * @param {Object} file - ملف Multer
 * @param {String} folder - اسم المجلد داخل Cloudinary
 * @returns {String} - الرابط العام للصورة (HTTPS)
 */
const uploadToCloudinary = (file, folder = 'products') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto', // يكتشف نوع الملف تلقائياً
        // تحسينات تلقائية للصور (اختياري)
        transformation: [
          { quality: "auto:good" }, // ضغط ذكي
          { fetch_format: "auto" }  // تحويل الصيغة للأفضل (WebP/AVIF)
        ]
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary Upload Error Details:', error);
          return reject(new Error(`Cloudinary Upload Error: ${error.message}`));
        }
        console.log('✅ Cloudinary Upload Success:', result.secure_url);
        resolve(result.secure_url);
      }
    );

    // تحويل الـ Buffer إلى Stream
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

module.exports = uploadToCloudinary;