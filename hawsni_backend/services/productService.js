const supabase = require('../config/supabase');

class ProductService {
    async getAllProducts(filters = {}, sort = null) {
        let query = supabase
            .from('products')
            .select('*, product_category_links(category_id, categories(name))')
            .eq('is_active', true);

        if (filters.category) {
            // Find products linked to this category in the join table
            const { data: linkedProducts, error: linkError } = await supabase
                .from('product_category_links')
                .select('product_id')
                .eq('category_id', filters.category);

            if (linkError) throw linkError;
            const productIds = linkedProducts.map(lp => lp.product_id);
            query = query.in('id', productIds);
        }

        if (filters.search) {
            query = query.ilike('name', `%${filters.search}%`);
        }

        if (filters.minPrice) {
            query = query.gte('price', parseFloat(filters.minPrice));
        }

        if (filters.maxPrice) {
            query = query.lte('price', parseFloat(filters.maxPrice));
        }

        if (sort) {
            const sortBy = sort === 'price_asc' ? 'price' : sort === 'price_desc' ? 'price.desc' : 'created_at.desc';
            query = query.order(sortBy);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    async getFeaturedProducts(limit = 10) {
        const { data, error } = await supabase
            .from('products')
            .select('*, product_category_links(category_id, categories(name))')
            .eq('is_featured', true)
            .eq('is_active', true)
            .limit(limit);

        if (error) throw error;
        return data;
    }

    async getProductById(id) {
        const { data, error } = await supabase
            .from('products')
            .select('*, product_category_links(category_id, categories(name))')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    async createProduct(productData) {
        const { category_ids, ...restOfData } = productData;

        const { data: product, error } = await supabase
            .from('products')
            .insert(restOfData)
            .select()
            .single();

        if (error) throw error;

        if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
            const links = category_ids.map(catId => ({
                product_id: product.id,
                category_id: catId
            }));
            const { error: linkError } = await supabase
                .from('product_category_links')
                .insert(links);

            if (linkError) throw linkError;
        }

        return product;
    }

    async updateProduct(id, productData) {
        const { category_ids, ...restOfData } = productData;

        const { data: product, error } = await supabase
            .from('products')
            .update(restOfData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (category_ids && Array.isArray(category_ids)) {
            // Remove old links
            const { error: deleteError } = await supabase
                .from('product_category_links')
                .delete()
                .eq('product_id', id);

            if (deleteError) throw deleteError;

            // Add new links
            if (category_ids.length > 0) {
                const links = category_ids.map(catId => ({
                    product_id: id,
                    category_id: catId
                }));
                const { error: linkError } = await supabase
                    .from('product_category_links')
                    .insert(links);

                if (linkError) throw linkError;
            }
        }

        return product;
    }

    async deleteProduct(id) {
        const { data, error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

module.exports = new ProductService();
