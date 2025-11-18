const supabase = require('../config/supabase');
const path = require('path');

/**
 * رفع ملف إلى Supabase Storage
 * @param {Object} file - ملف Multer
 * @param {String} folder - اسم المجلد داخل الـ Bucket (products/categories)
 * @returns {String} - الرابط العام للصورة
 */
const uploadToSupabase = async (file, folder = 'products') => {
  try {
    // إنشاء اسم فريد للملف
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${folder}/${timestamp}-${Math.round(Math.random() * 1E9)}${ext}`;

    // رفع الملف (Buffer) إلى Supabase
    const { data, error } = await supabase.storage
      .from('images') // تأكد أن اسم الـ bucket هو images كما أنشأته
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      throw new Error(`Supabase Upload Error: ${error.message}`);
    }

    // الحصول على الرابط العام
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filename);

    return publicUrlData.publicUrl;

  } catch (err) {
    console.error('Upload function error:', err);
    throw err;
  }
};

module.exports = uploadToSupabase;