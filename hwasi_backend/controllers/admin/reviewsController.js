const { supabaseAdmin: supabase } = require('../../config/supabase');
const uploadToCloudinary = require('../../utils/fileUpload');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_IMAGE_RE = /^https:\/\/res\.cloudinary\.com\//i;

class AdminReviewController {
    async index(req, res) {
        try {
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('id, name')
                .order('name', { ascending: true });
            if (productsError) throw productsError;

            const { data: reviews, error: reviewsError } = await supabase
                .from('reviews')
                .select('id, product_id, rating, comment, created_at, custom_name, images')
                .order('created_at', { ascending: false })
                .limit(50);
            if (reviewsError) throw reviewsError;

            const productMap = {};
            (products || []).forEach(p => { productMap[p.id] = p.name; });
            const enriched = (reviews || []).map(r => ({
                ...r,
                productName: productMap[r.product_id] || r.product_id
            }));

            res.render('reviews', {
                page: 'reviews',
                title: 'إدارة التقييمات',
                products: products || [],
                reviews: enriched,
                success: req.query.success,
                error: req.query.error
            });
        } catch (err) {
            console.error('Admin reviews error:', err);
            res.status(500).send('خطأ في تحميل التقييمات');
        }
    }

    async create(req, res) {
        try {
            const { product_id, custom_name, rating, comment } = req.body;
            const rawImages = req.body.images || req.body['images[]'];
            const images = (rawImages
                ? (Array.isArray(rawImages) ? rawImages : [rawImages])
                : []
            ).filter(url => typeof url === 'string' && SAFE_IMAGE_RE.test(url)).slice(0, 4);

            if (!product_id || !UUID_RE.test(product_id)) {
                return res.redirect('/admin/reviews?error=' + encodeURIComponent('يرجى اختيار المنتج'));
            }

            const cleanName = String(custom_name || '').trim();
            if (!cleanName || cleanName.length > 80) {
                return res.redirect('/admin/reviews?error=' + encodeURIComponent('يرجى إدخال اسم المراجع (80 حرفًا كحد أقصى)'));
            }

            const numericRating = Math.round(Number(rating));
            if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
                return res.redirect('/admin/reviews?error=' + encodeURIComponent('يرجى اختيار تقييم من 1 إلى 5'));
            }

            const { error } = await supabase
                .from('reviews')
                .insert([{
                    product_id,
                    custom_name: cleanName,
                    rating: numericRating,
                    comment: String(comment || '').trim().slice(0, 1000),
                    images
                }]);
            if (error) throw error;

            await this._refreshProductRating(product_id);
            res.redirect('/admin/reviews?success=1');
        } catch (err) {
            console.error('Create review error:', err);
            res.redirect('/admin/reviews?error=' + encodeURIComponent('تعذر إضافة التقييم. حاول مرة أخرى.'));
        }
    }

    async uploadImages(req, res) {
        try {
            const files = Array.isArray(req.files) ? req.files.slice(0, 4) : [];
            if (files.length === 0) {
                return res.status(400).json({ success: false, message: 'لم يتم اختيار صور' });
            }

            const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
            for (const file of files) {
                if (!allowed.has(file.mimetype)) {
                    return res.status(400).json({ success: false, message: 'مسموح فقط بصور JPG أو PNG أو WebP أو GIF' });
                }
                if (file.size > 4.5 * 1024 * 1024) {
                    return res.status(400).json({ success: false, message: 'حجم كل صورة يجب أن يكون أقل من 4.5MB' });
                }
            }

            const uploaded = await Promise.all(files.map(file => uploadToCloudinary(file, 'reviews')));
            res.json({ success: true, urls: uploaded.map(item => item.url) });
        } catch (err) {
            console.error('Review image upload error:', err);
            res.status(500).json({ success: false, message: 'تعذر رفع الصور. حاول مرة أخرى.' });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            if (!UUID_RE.test(id)) {
                return res.status(400).json({ success: false, message: 'معرّف غير صالح' });
            }

            const { data: review, error: findError } = await supabase
                .from('reviews')
                .select('product_id')
                .eq('id', id)
                .maybeSingle();
            if (findError) throw findError;
            if (!review) {
                return res.status(404).json({ success: false, message: 'التقييم غير موجود' });
            }

            const { error: deleteError } = await supabase.from('reviews').delete().eq('id', id);
            if (deleteError) throw deleteError;

            await this._refreshProductRating(review.product_id);
            res.json({ success: true });
        } catch (err) {
            console.error('Delete review error:', err);
            res.status(500).json({ success: false, message: 'تعذر حذف التقييم' });
        }
    }

    async _refreshProductRating(productId) {
        const { data: remaining, error } = await supabase
            .from('reviews')
            .select('rating')
            .eq('product_id', productId);
        if (error) throw error;

        const count = remaining?.length || 0;
        const avg = count > 0
            ? remaining.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / count
            : 0;

        const { error: updateError } = await supabase
            .from('products')
            .update({ rating: Number(avg.toFixed(2)), num_reviews: count })
            .eq('id', productId);
        if (updateError) throw updateError;
    }
}

module.exports = new AdminReviewController();
