const ReviewService = require('../../services/reviewService');

class ReviewController {
    async getProductReviews(req, res) {
        try {
            const reviews = await ReviewService.getProductReviews(req.params.productId);
            res.json({ success: true, reviews });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async createReview(req, res) {
        try {
            const { productId, rating, comment, images } = req.body;
            const review = await ReviewService.createReview(
                req.user.id,
                productId,
                rating,
                comment,
                images || [],
                req.user.name || ''   // stored as reviewer_name safety net
            );
            res.status(201).json({ success: true, review });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async updateReview(req, res) {
        try {
            const { rating, comment } = req.body;
            const review = await ReviewService.updateReview(req.params.id, req.user.id, rating, comment);
            res.json({ success: true, review });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async deleteReview(req, res) {
        try {
            await ReviewService.deleteReview(req.params.id, req.user.id, req.user.role === 'admin');
            res.json({ success: true, message: 'Review deleted' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ReviewController();
