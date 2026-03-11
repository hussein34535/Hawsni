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
    const isVideo = file.mimetype && file.mimetype.startsWith('video/');

    // Set appropriate transformations based on media type
    const uploadOptions = {
      folder: folder,
      resource_type: 'auto',
    };

    if (isVideo) {
      // ضغط الفيديو بقوة: حد أقصى 1280x720 مع bitrate 800k → ناتج ~5-10MB لمدة دقيقة
      uploadOptions.transformation = [
        {
          width: 1280,
          height: 720,
          crop: 'limit',           // مش بيكبر لو أصغر، بس بيصغر لو أكبر
          bit_rate: '800k',        // الجودة المقبولة مع حجم صغير
          video_codec: 'h264',     // الأكثر ضغطاً وتوافقاً
          audio_codec: 'aac',
          fetch_format: 'mp4',     // إجباري mp4 لأقل حجم
        }
      ];
      // تحديد الحجم الأقصى للملف الأصلي اللي يترفع - 200MB
      if (file.size && file.size > 200 * 1024 * 1024) {
        return reject(new Error('حجم الفيديو كبير جداً، الحد الأقصى 200MB'));
      }
      console.log(`📹 Uploading video with compression (original size: ${Math.round((file.size || 0) / 1024 / 1024)}MB)`);
    } else {
      uploadOptions.transformation = [
        { width: 1200, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ];
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary Upload Error Details:', error);
          return reject(new Error(`Cloudinary Upload Error: ${error.message}`));
        }
        const sizeMB = result.bytes ? Math.round(result.bytes / 1024 / 1024 * 10) / 10 : '?';
        console.log(`✅ Cloudinary Upload Success: ${result.secure_url} (${sizeMB}MB)`);
        resolve({ url: result.secure_url, blurHash: null });
      }
    );

    // تحويل الـ Buffer إلى Stream
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

module.exports = uploadToCloudinary;