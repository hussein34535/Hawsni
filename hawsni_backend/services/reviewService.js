const supabase = require('../config/supabase');

class ReviewService {
    async getProductReviews(productId) {
        // Single query with join — avoids N+1 lookups
        const { data, error } = await supabase
            .from('reviews')
            .select('id, rating, comment, images, custom_name, reviewer_name, created_at, user_id, users(name)')
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('ReviewService.getProductReviews error:', error.message);
            throw new Error(error.message);
        }

        const enhancedData = (data || []).map((review) => {
            // Priority: custom_name (admin) > reviewer_name (saved at insert) > join name > Anonymous
            const joinedName = review.users?.name;
            const userName = review.custom_name ||
                review.reviewer_name ||
                joinedName ||
                'Anonymous';

            return {
                ...review,
                _id: review.id,
                images: review.images || [],
                user: { name: userName, _id: review.user_id }
            };
        });

        return enhancedData;
    }

    async createReview(userId, productId, rating, comment, images = [], reviewerName = '') {
        // Check if already reviewed
        const { data: existing } = await supabase
            .from('reviews')
            .select('id')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .single();

        if (existing) {
            throw new Error('You already reviewed this product');
        }

        const { data, error } = await supabase
            .from('reviews')
            .insert([{
                user_id: userId,
                product_id: productId,
                rating,
                comment,
                images: images || [],
                // Store name as safety net in case join ever fails
                reviewer_name: reviewerName || null,
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);

        await this.updateProductRating(productId);

        return data;
    }

    async updateReview(reviewId, userId, rating, comment) {
        const { data: review } = await supabase
            .from('reviews')
            .select('*')
            .eq('id', reviewId)
            .single();

        if (!review) throw new Error('Review not found');
        if (review.user_id !== userId) throw new Error('Not authorized');

        const updates = {};
        if (rating) updates.rating = rating;
        if (comment) updates.comment = comment;

        const { data, error } = await supabase
            .from('reviews')
            .update(updates)
            .eq('id', reviewId)
            .select()
            .single();

        if (error) throw new Error(error.message);

        await this.updateProductRating(review.product_id);

        return data;
    }

    async deleteReview(reviewId, userId, isAdmin) {
        const { data: review } = await supabase
            .from('reviews')
            .select('*')
            .eq('id', reviewId)
            .single();

        if (!review) throw new Error('Review not found');
        if (review.user_id !== userId && !isAdmin) throw new Error('Not authorized');

        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', reviewId);

        if (error) throw new Error(error.message);

        await this.updateProductRating(review.product_id);

        return true;
    }

    async updateProductRating(productId) {
        const { data: reviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('product_id', productId);

        if (!reviews || reviews.length === 0) {
            await supabase
                .from('products')
                .update({ rating: 0, num_reviews: 0 })
                .eq('id', productId);
            return;
        }

        const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

        await supabase
            .from('products')
            .update({ rating: avgRating, num_reviews: reviews.length })
            .eq('id', productId);
    }
}

module.exports = new ReviewService();
