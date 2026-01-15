const supabase = require('../config/supabase');

class ReviewService {
    async getProductReviews(productId) {
        // Get reviews without join first
        const { data, error } = await supabase
            .from('reviews')
            .select('id, rating, comment, created_at, user_id')
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        // Debug: Log the raw data from Supabase
        console.log('Supabase raw response:', JSON.stringify(data, null, 2));

        // Get user names for each review
        const enhancedData = await Promise.all(data.map(async (review) => {
            let userName = 'Anonymous';
            if (review.user_id) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('name')
                    .eq('id', review.user_id)
                    .single();
                if (userData) {
                    userName = userData.name || 'Anonymous';
                }
            }
            return {
                ...review,
                user: { name: userName, id: review.user_id }
            };
        }));

        return enhancedData;
    }

    async createReview(userId, productId, rating, comment) {
        // Check if already reviewed
        const { data: existing } = await supabase
            .from('reviews')
            .select('*')
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
                comment
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
