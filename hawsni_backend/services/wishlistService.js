const supabase = require('../config/supabase');

class WishlistService {
    async getWishlist(userId) {
        // Assuming 'wishlist' table has 'user_id' and 'product_id'
        // and there is a foreign key relationship to 'products'
        const { data, error } = await supabase
            .from('wishlist')
            .select('*, product:products(*)')
            .eq('user_id', userId);

        if (error) throw new Error(error.message);

        // Transform data to match expected frontend format (list of products)
        // The query returns array of { user_id, product_id, product: {...} }
        // We want to return the products.
        return {
            products: data.map(item => item.product).filter(p => p !== null)
        };
    }

    async addToWishlist(userId, productId) {
        // Check if already exists
        const { data: existing } = await supabase
            .from('wishlist')
            .select('*')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .single();

        if (existing) {
            return this.getWishlist(userId);
        }

        const { error } = await supabase
            .from('wishlist')
            .insert([{ user_id: userId, product_id: productId }]);

        if (error) throw new Error(error.message);

        return this.getWishlist(userId);
    }

    async removeFromWishlist(userId, productId) {
        const { error } = await supabase
            .from('wishlist')
            .delete()
            .eq('user_id', userId)
            .eq('product_id', productId);

        if (error) throw new Error(error.message);

        return this.getWishlist(userId);
    }
}

module.exports = new WishlistService();
