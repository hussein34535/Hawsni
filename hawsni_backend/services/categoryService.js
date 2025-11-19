const supabase = require('../config/supabase');

class CategoryService {
    async getAllCategories() {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    async getCategoryById(id) {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    async createCategory(categoryData) {
        // Get max sort order
        const { data: maxOrderData } = await supabase
            .from('categories')
            .select('sort_order')
            .order('sort_order', { ascending: false })
            .limit(1)
            .maybeSingle();

        const maxOrder = maxOrderData?.sort_order || 0;

        const { data, error } = await supabase
            .from('categories')
            .insert({
                ...categoryData,
                sort_order: maxOrder + 1
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateCategory(id, categoryData) {
        const { data, error } = await supabase
            .from('categories')
            .update(categoryData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteCategory(id) {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }

    async reorderCategories(categories) {
        const updates = categories.map(({ id, sort_order }) => {
            return supabase.from('categories').update({ sort_order: parseInt(sort_order) }).eq('id', id);
        });

        const results = await Promise.all(updates);
        const errors = results.filter(result => result.error);

        if (errors.length > 0) {
            throw new Error('Failed to update sort orders: ' + errors.map(e => e.error.message).join(', '));
        }

        return true;
    }
}

module.exports = new CategoryService();
