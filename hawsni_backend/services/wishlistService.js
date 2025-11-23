const supabase = require('../config/supabase');

class WishlistService {
    async getWishlist(userId) {
        // 1. Get user's wishlist ID
        const { data: wishlist, error: wishlistError } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (wishlistError && wishlistError.code !== 'PGRST116') { // PGRST116 is "Row not found"
            throw new Error(wishlistError.message);
        }

        if (!wishlist) {
            return { products: [] };
        }

        // 2. Get items in the wishlist
        const { data: items, error: itemsError } = await supabase
            .from('wishlist_items')
            .select('product:products(*)')
            .eq('wishlist_id', wishlist.id);

        if (itemsError) throw new Error(itemsError.message);

        return {
            products: items.map(item => item.product).filter(p => p !== null)
        };
    }

    async addToWishlist(userId, productId) {
        // 1. Get or Create Wishlist
        let { data: wishlist, error: wishlistError } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (wishlistError && wishlistError.code !== 'PGRST116') {
            throw new Error(wishlistError.message);
        }

        if (!wishlist) {
            const { data: newWishlist, error: createError } = await supabase
                .from('wishlists')
                .insert([{ user_id: userId }])
                .select()
                .single();

            if (createError) throw new Error(createError.message);
            wishlist = newWishlist;
        }

        // 2. Add item to wishlist_items
        const { error: insertError } = await supabase
            .from('wishlist_items')
            .insert([{ wishlist_id: wishlist.id, product_id: productId }])
            .select()
            .single();

        // Ignore duplicate key error (already in wishlist)
        if (insertError && insertError.code !== '23505') {
            throw new Error(insertError.message);
        }

        return this.getWishlist(userId);
    }

    async removeFromWishlist(userId, productId) {
        // 1. Get wishlist ID
        const { data: wishlist, error: wishlistError } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (wishlistError || !wishlist) {
            // If no wishlist, nothing to remove
            return this.getWishlist(userId);
        }

        // 2. Remove item
        const { error } = await supabase
            .from('wishlist_items')
            .delete()
            .eq('wishlist_id', wishlist.id)
            .eq('product_id', productId);

        if (error) throw new Error(error.message);

        return this.getWishlist(userId);
    }
}

module.exports = new WishlistService();
