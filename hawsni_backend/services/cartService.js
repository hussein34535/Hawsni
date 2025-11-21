const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class CartService {
    async getCart(userId) {
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
            .eq('user_id', userId);

        if (error) throw new Error(error.message);

        // Transform data to match expected frontend format if necessary
        // But for now returning as is, controller can format
        return { items: data || [] };
    }

    async addToCart(userId, itemData) {
        const { productId, quantity, size, color } = itemData;

        // Check if item already exists
        const { data: existingItems, error: fetchError } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', userId)
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
                    user_id: userId,
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
        const { data, error } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('id', itemId)
            .eq('user_id', userId) // Ensure user owns the item
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
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', itemId)
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
        return true;
    }

    async clearCart(userId) {
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
        return true;
    }
}

module.exports = new CartService();
