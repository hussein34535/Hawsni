const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'djxkwged9',
  api_key: '995382833695689',
  api_secret: 'Y4zFQM1fFjBpNjSv7PpswVMhA8Q'
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
          console.error('Cloudinary Upload Error:', error);
          return reject(new Error(`Cloudinary Upload Error: ${error.message}`));
        }
        resolve(result.secure_url);
      }
    );

    // تحويل الـ Buffer إلى Stream
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

module.exports = uploadToCloudinary;