const supabase = require('../config/supabase');

class ProductService {
    async getAllProducts(filters = {}, sort = null) {
        let query = supabase
            .from('products')
            .select('*, categories(name)')
            .eq('is_active', true);

        if (filters.category) {
            query = query.eq('category_id', filters.category);
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
            .select('*, categories(name)')
            .eq('is_featured', true)
            .eq('is_active', true)
            .limit(limit);

        if (error) throw error;
        return data;
    }

    async getProductById(id) {
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    async createProduct(productData) {
        const { data, error } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateProduct(id, productData) {
        const { data, error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
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
