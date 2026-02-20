const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const path = require('path');
const { encode } = require('blurhash');
const { createCanvas, Image } = require('canvas');
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
 * Calculate Blurhash from image buffer
 * @param {Buffer} buffer - Image Buffer
 * @returns {Promise<String>} - Blurhash string
 */
const getBlurhash = async (buffer) => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        // Redimension to small size for quick processing
        const width = 32;
        const height = Math.round((img.height / img.width) * 32) || 32;

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const blurhash = encode(imageData.data, imageData.width, imageData.height, 4, 3);
        resolve(blurhash);
      };
      img.onerror = (err) => {
        console.error('Error loading image for blurhash:', err);
        resolve(null); // Resolve with null on error so upload doesn't fail completely
      };
      img.src = buffer;
    } catch (err) {
      console.error('Error generating blurhash:', err);
      resolve(null);
    }
  });
};

/**
 * رفع ملف إلى Cloudinary Storage
 * @param {Object} file - ملف Multer
 * @param {String} folder - اسم المجلد داخل Cloudinary
 * @returns {Promise<{url: String, blurhash: String}>} - الرابط العام للصورة كعنصر مستقل بالإضافة لكود blurhash
 */
const uploadToCloudinary = async (file, folder = 'products') => {
  const blurhash = await getBlurhash(file.buffer);

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
        resolve({ url: result.secure_url, blurHash: blurhash });
      }
    );

    // تحويل الـ Buffer إلى Stream
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

module.exports = uploadToCloudinary;