const supabase = require('../../config/supabase');

class AdminReviewController {
    // Render the reviews management page
    async index(req, res) {
        try {
            // Fetch all products for the dropdown
            const { data: products } = await supabase
                .from('products')
                .select('id, name')
                .order('name', { ascending: true });

            // Fetch recent reviews (last 50)
            const { data: reviews } = await supabase
                .from('reviews')
                .select('id, product_id, rating, comment, created_at, custom_name')
                .order('created_at', { ascending: false })
                .limit(50);

            // Enrich with product names
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

    // Create a review manually
    async create(req, res) {
        try {
            const { product_id, custom_name, rating, comment } = req.body;
            // Express might parse it as `req.body.images` or `req.body['images[]']`
            const rawImages = req.body.images || req.body['images[]'];
            const images = rawImages
                ? (Array.isArray(rawImages) ? rawImages : [rawImages])
                : [];

            if (!product_id) {
                return res.redirect('/admin/reviews?error=يرجى+اختيار+المنتج');
            }
            if (!custom_name || !custom_name.trim()) {
                return res.redirect('/admin/reviews?error=يرجى+إدخال+اسم+المراجع');
            }
            if (!rating || parseFloat(rating) === 0) {
                return res.redirect('/admin/reviews?error=يرجى+اختيار+التقييم+(النجوم)');
            }

            const { error } = await supabase
                .from('reviews')
                .insert([{
                    product_id,
                    custom_name: custom_name.trim(),
                    rating: parseFloat(rating),
                    comment: (comment || '').trim(),
                    images,
                }]);

            if (error) throw new Error(error.message);

            // Update product average rating
            const { data: allReviews } = await supabase
                .from('reviews')
                .select('rating')
                .eq('product_id', product_id);

            if (allReviews && allReviews.length > 0) {
                const avg = allReviews.reduce((a, r) => a + r.rating, 0) / allReviews.length;
                await supabase
                    .from('products')
                    .update({ rating: avg, num_reviews: allReviews.length })
                    .eq('id', product_id);
            }

            res.redirect('/admin/reviews?success=1');
        } catch (err) {
            console.error('Create review error:', err);
            res.redirect(`/admin/reviews?error=${encodeURIComponent(err.message)}`);
        }
    }

    // Delete a review
    async delete(req, res) {
        try {
            const { id } = req.params;

            // Get product_id before deletion for rating update
            const { data: review } = await supabase
                .from('reviews')
                .select('product_id')
                .eq('id', id)
                .single();

            await supabase.from('reviews').delete().eq('id', id);

            // Update product rating after deletion
            if (review) {
                const { data: remaining } = await supabase
                    .from('reviews')
                    .select('rating')
                    .eq('product_id', review.product_id);

                if (remaining && remaining.length > 0) {
                    const avg = remaining.reduce((a, r) => a + r.rating, 0) / remaining.length;
                    await supabase
                        .from('products')
                        .update({ rating: avg, num_reviews: remaining.length })
                        .eq('id', review.product_id);
                } else {
                    await supabase
                        .from('products')
                        .update({ rating: 0, num_reviews: 0 })
                        .eq('id', review.product_id);
                }
            }

            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
}

module.exports = new AdminReviewController();
