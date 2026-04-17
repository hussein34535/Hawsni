const CartService = require('../../services/cartService');

class CartController {
    async getCart(req, res) {
        try {
            const cart = await CartService.getCart(req.user.id);
            res.json({ success: true, cart });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async addToCart(req, res) {
        try {
            const { productId, quantity, size, color } = req.body;

            if (!productId || !quantity) {
                return res.status(400).json({ success: false, message: 'Product ID and quantity are required' });
            }

            await CartService.addToCart(req.user.id, { productId, quantity, size, color });

            // Return updated cart
            const cart = await CartService.getCart(req.user.id);
            res.json({ success: true, cart });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async syncCart(req, res) {
        try {
            const { items } = req.body;
            
            if (!items || !Array.isArray(items)) {
                return res.status(400).json({ success: false, message: 'Items array is required' });
            }

            if (items.length > 0) {
                await CartService.syncCartItems(req.user.id, items);
            }

            const cart = await CartService.getCart(req.user.id);
            res.json({ success: true, cart });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateCartItem(req, res) {
        try {
            const { quantity } = req.body;
            const { itemId } = req.params;

            if (!quantity) {
                return res.status(400).json({ success: false, message: 'Quantity is required' });
            }

            await CartService.updateCartItem(req.user.id, itemId, quantity);

            // Return updated cart
            const cart = await CartService.getCart(req.user.id);
            res.json({ success: true, cart });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async removeFromCart(req, res) {
        try {
            const { itemId } = req.params;
            await CartService.removeFromCart(req.user.id, itemId);

            // Return updated cart
            const cart = await CartService.getCart(req.user.id);
            res.json({ success: true, cart });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async clearCart(req, res) {
        try {
            await CartService.clearCart(req.user.id);
            res.json({ success: true, message: 'Cart cleared', cart: { items: [] } });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new CartController();
