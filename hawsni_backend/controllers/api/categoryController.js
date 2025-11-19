const CategoryService = require('../../services/categoryService');
const uploadToSupabase = require('../../utils/fileUpload');

class CategoryController {
    // API Methods
    async getCategories(req, res) {
        try {
            const categories = await CategoryService.getAllCategories();
            res.json({
                success: true,
                count: categories.length,
                categories
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async createCategoryApi(req, res) {
        try {
            const { name, description } = req.body;

            if (!name) {
                return res.status(400).json({ success: false, message: 'Category name is required' });
            }

            let imageUrl = null;
            if (req.file) {
                imageUrl = await uploadToSupabase(req.file, 'categories');
            }

            const category = await CategoryService.createCategory({
                name,
                description: description || '',
                image: imageUrl
            });

            res.status(201).json({ success: true, category });
        } catch (error) {
            console.error('Error creating category:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateCategoryApi(req, res) {
        try {
            const { name, description, is_active } = req.body;

            const updateData = {
                name,
                description: description || '',
                is_active: is_active !== undefined ? is_active : true
            };

            if (req.file) {
                updateData.image = await uploadToSupabase(req.file, 'categories');
            }

            const category = await CategoryService.updateCategory(req.params.id, updateData);

            res.json({ success: true, category });
        } catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async deleteCategoryApi(req, res) {
        try {
            await CategoryService.deleteCategory(req.params.id);
            res.json({ success: true, message: 'Category deleted' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Admin UI Methods
    async renderCategoriesPage(req, res) {
        try {
            const categories = await CategoryService.getAllCategories();
            res.render('categories', { categories: categories || [] });
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).send(`Error fetching categories: ${error.message}`);
        }
    }

    async renderEditPage(req, res) {
        try {
            const category = await CategoryService.getCategoryById(req.params.id);

            if (!category) {
                return res.status(404).send('Category not found');
            }

            res.render('category-edit', { category });
        } catch (error) {
            console.error('Error fetching category:', error);
            res.status(500).send(`Error fetching category: ${error.message}`);
        }
    }

    async createCategoryAdmin(req, res) {
        try {
            const { name, description } = req.body;

            if (!name) {
                return res.status(400).send('Category name is required');
            }

            let imageUrl = null;
            if (req.file) {
                imageUrl = await uploadToSupabase(req.file, 'categories');
            }

            await CategoryService.createCategory({
                name,
                description: description || '',
                image: imageUrl
            });

            res.redirect('/categories');
        } catch (err) {
            console.error('Server error:', err);
            res.status(500).send(`Server error: ${err.message}`);
        }
    }

    async updateCategoryAdmin(req, res) {
        try {
            const { name, description, is_active } = req.body;

            if (!name) {
                return res.status(400).send('Category name is required');
            }

            const updateData = {
                name,
                description: description || '',
                is_active: is_active === 'on' || is_active === 'true' || is_active === true
            };

            if (req.file) {
                updateData.image = await uploadToSupabase(req.file, 'categories');
            }

            await CategoryService.updateCategory(req.params.id, updateData);

            res.redirect('/categories');
        } catch (err) {
            console.error('Server error:', err);
            res.status(500).send(`Server error: ${err.message}`);
        }
    }

    async deleteCategoryAdmin(req, res) {
        try {
            await CategoryService.deleteCategory(req.params.id);
            res.redirect('/categories');
        } catch (error) {
            console.error('Supabase error:', error);
            return res.status(500).send(`Error deleting category: ${error.message}`);
        }
    }

    async reorderCategories(req, res) {
        try {
            const { categories } = req.body;

            if (!categories || !Array.isArray(categories)) {
                return res.status(400).json({ success: false, message: 'Invalid categories data' });
            }

            await CategoryService.reorderCategories(categories);

            res.json({ success: true, categories });
        } catch (error) {
            console.error('ERROR in reorder route:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new CategoryController();
