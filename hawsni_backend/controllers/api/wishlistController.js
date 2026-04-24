const WishlistService = require('../../services/wishlistService');

class WishlistController {
    async getWishlist(req, res) {
        try {
            const wishlist = await WishlistService.getWishlist(req.user.id);
            res.json({ success: true, wishlist });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async addToWishlist(req, res) {
        try {
            const { productId } = req.params;
            const wishlist = await WishlistService.addToWishlist(req.user.id, productId);
            res.json({ success: true, wishlist });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async removeFromWishlist(req, res) {
        try {
            const { productId } = req.params;
            const wishlist = await WishlistService.removeFromWishlist(req.user.id, productId);
            res.json({ success: true, wishlist });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new WishlistController();
