const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('Cloudinary Config:', {
  cloud_name: process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: (process.env.CLOUDINARY_KEY || process.env.CLOUDINARY_API_KEY) ? '***' : 'MISSING',
  api_secret: (process.env.CLOUDINARY_SECRET || process.env.CLOUDINARY_API_SECRET) ? '***' : 'MISSING'
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY || process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET || process.env.CLOUDINARY_API_SECRET
});

/**
 * رفع ملف إلى Cloudinary Storage
 * @param {Object} file - ملف Multer
 * @param {String} folder - اسم المجلد داخل Cloudinary
 * @returns {Promise<{url: String, blurHash: String|null}>}
 */
const uploadToCloudinary = async (file, folder = 'products') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        transformation: [
          { width: 1200, crop: "limit" }, // Limit max width to 1200px
          { quality: "auto:good" },
          { fetch_format: "auto" }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary Upload Error Details:', error);
          return reject(new Error(`Cloudinary Upload Error: ${error.message}`));
        }
        console.log('✅ Cloudinary Upload Success:', result.secure_url);
        resolve({ url: result.secure_url, blurHash: null });
      }
    );

    // تحويل الـ Buffer إلى Stream
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

module.exports = uploadToCloudinary;