const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class CartService {
    // Helper to get or create a cart for the user
    async _getOrCreateCart(userId) {
        // Try to find existing cart
        const { data: cart, error } = await supabase
            .from('carts')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
            throw new Error(error.message);
        }

        if (cart) {
            return cart.id;
        }

        // Create new cart
        const { data: newCart, error: createError } = await supabase
            .from('carts')
            .insert({ user_id: userId })
            .select('id')
            .single();

        if (createError) throw new Error(createError.message);
        return newCart.id;
    }

    async getCart(userId) {
        const cartId = await this._getOrCreateCart(userId);

        const { data, error } = await supabase
            .from('cart_items')
            .select(`
                id,
                quantity,
                size,
                color,
                product:products (
                    id,
                    name,
                    price,
                    images
                )
            `)
            .eq('cart_id', cartId);

        if (error) throw new Error(error.message);

        return { items: data || [] };
    }

    async addToCart(userId, itemData) {
        const { productId, quantity, size, color } = itemData;
        const cartId = await this._getOrCreateCart(userId);

        // Check if item already exists in this cart
        const { data: existingItems, error: fetchError } = await supabase
            .from('cart_items')
            .select('*')
            .eq('cart_id', cartId)
            .eq('product_id', productId)
            .eq('size', size || '') // Handle null/undefined size
            .eq('color', color || ''); // Handle null/undefined color

        if (fetchError) throw new Error(fetchError.message);

        if (existingItems && existingItems.length > 0) {
            // Update quantity
            const item = existingItems[0];
            const newQuantity = item.quantity + quantity;

            const { data, error } = await supabase
                .from('cart_items')
                .update({ quantity: newQuantity })
                .eq('id', item.id)
                .select(`
                    id,
                    quantity,
                    size,
                    color,
                    product:products (
                        id,
                        name,
                        price,
                        images
                    )
                `)
                .single();

            if (error) throw new Error(error.message);
            return data;
        } else {
            // Insert new item
            const { data, error } = await supabase
                .from('cart_items')
                .insert({
                    cart_id: cartId,
                    product_id: productId,
                    quantity,
                    size: size || null,
                    color: color || null
                })
                .select(`
                    id,
                    quantity,
                    size,
                    color,
                    product:products (
                        id,
                        name,
                        price,
                        images
                    )
                `)
                .single();

            if (error) throw new Error(error.message);
            return data;
        }
    }

    async updateCartItem(userId, itemId, quantity) {
        const cartId = await this._getOrCreateCart(userId);

        // Verify the item belongs to the user's cart
        const { data, error } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('id', itemId)
            .eq('cart_id', cartId)
            .select(`
                id,
                quantity,
                size,
                color,
                product:products (
                    id,
                    name,
                    price,
                    images
                )
            `)
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async removeFromCart(userId, itemId) {
        const cartId = await this._getOrCreateCart(userId);

        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', itemId)
            .eq('cart_id', cartId);

        if (error) throw new Error(error.message);
        return true;
    }

    async clearCart(userId) {
        const cartId = await this._getOrCreateCart(userId);

        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('cart_id', cartId);

        if (error) throw new Error(error.message);
        return true;
    }
}

module.exports = new CartService();
