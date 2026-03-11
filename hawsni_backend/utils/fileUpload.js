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

    const uploadOptions = {
      folder: folder,
      resource_type: isVideo ? 'video' : 'auto', // Explicitly set video
    };

    if (isVideo) {
      // Aggressive video compression
      uploadOptions.transformation = [
        {
          width: 1280,
          height: 720,
          crop: 'limit',
          bit_rate: '500k',        // Very small file size (~3.75MB/min)
          quality: 'auto:eco',     // More aggressive compression
          video_codec: 'h264',
          audio_codec: 'aac',
          fetch_format: 'mp4',
        }
      ];

      // Use eager to ensure the transformation is applied and accessible
      uploadOptions.eager = uploadOptions.transformation;
      uploadOptions.eager_async = false; // Wait for it to be ready

      if (file.size && file.size > 200 * 1024 * 1024) {
        return reject(new Error('حجم الفيديو كبير جداً، الحد الأقصى 200MB'));
      }
      console.log(`📹 Uploading video with aggressive compression (original size: ${Math.round((file.size || 0) / 1024 / 1024)}MB)`);
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
          console.error('❌ Cloudinary Upload Error:', error);
          return reject(new Error(`Cloudinary Upload Error: ${error.message}`));
        }
        
        // If it's a video, prefer the eager transformation URL (which is definitely compressed)
        let finalUrl = result.secure_url;
        if (isVideo && result.eager && result.eager.length > 0) {
          finalUrl = result.eager[0].secure_url;
        }

        const sizeMB = result.bytes ? Math.round(result.bytes / 1024 / 1024 * 10) / 10 : '?';
        console.log(`✅ Upload Success: ${finalUrl} (${sizeMB}MB)`);
        
        resolve({ url: finalUrl, blurHash: null });
      }
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

module.exports = uploadToCloudinary;