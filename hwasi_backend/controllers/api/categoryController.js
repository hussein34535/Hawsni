const { supabaseAdmin: supabase } = require('../../config/supabase');
const uploadToSupabase = require('../../utils/fileUpload');
const CategoryService = require('../../services/categoryService');

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
                const result = await uploadToSupabase(req.file, 'categories');
                imageUrl = result ? (result.url || result) : null;
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
                const result = await uploadToSupabase(req.file, 'categories');
                updateData.image = result ? (result.url || result) : null;
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
            const { data: categories, error } = await supabase
                .from('categories')
                .select('*')
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Supabase error:', error);
                return res.status(500).send(`خطأ في جلب التصنيفات: ${error.message}`);
            }

            res.render('categories', { categories: categories || [] });
        } catch (error) {
            console.error('Error rendering categories page:', error);
            res.status(500).send(`خطأ في عرض صفحة التصنيفات: ${error.message}`);
        }
    }

    async renderEditPage(req, res) {
        try {
            const { data: category, error } = await supabase
                .from('categories')
                .select('*')
                .eq('id', req.params.id)
                .single();

            if (error) {
                console.error('❌ Supabase error:', error);
                return res.status(500).send(`خطأ في جلب التصنيف: ${error.message}`);
            }

            if (!category) {
                return res.status(404).send('التصنيف غير موجود');
            }

            // Fetch all products and the ones currently linked to this category
            // so the category page can manage its own product assignments.
            const [productsRes, linksRes] = await Promise.all([
                supabase.from('products').select('id, name, images, price, is_active').order('created_at', { ascending: false }),
                supabase.from('product_category_links').select('product_id').eq('category_id', category.id)
            ]);

            if (productsRes.error) {
                console.error('❌ Supabase error (products):', productsRes.error);
                return res.status(500).send(`خطأ في جلب المنتجات: ${productsRes.error.message}`);
            }

            const linkedProductIds = (linksRes.data || []).map(l => l.product_id);

            res.render('category-edit', {
                category,
                products: productsRes.data || [],
                linkedProductIds
            });
        } catch (error) {
            console.error('Error rendering edit page:', error);
            res.status(500).send(`خطأ في عرض صفحة التعديل: ${error.message}`);
        }
    }

    async createCategoryAdmin(req, res) {
        try {
            const { name, description } = req.body;

            if (!name) {
                return res.status(400).send('اسم التصنيف مطلوب');
            }

            const { data: maxOrderData, error: maxOrderError } = await supabase
                .from('categories')
                .select('sort_order')
                .order('sort_order', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (maxOrderError) {
                console.error('❌ Supabase error:', maxOrderError);
                return res.status(500).send(`خطأ في جلب الترتيب: ${maxOrderError.message}`);
            }

            const maxOrder = maxOrderData?.sort_order || 0;

            let imageUrl = null;
            if (req.file) {
                const result = await uploadToSupabase(req.file, 'categories');
                imageUrl = result ? (result.url || result) : null;
            }

            const { data, error } = await supabase.from('categories').insert({
                name,
                description: description || '',
                image: imageUrl,
                sort_order: maxOrder + 1
            }).select().single();

            if (error) {
                console.error('❌ Supabase error:', error);
                return res.status(500).send(`خطأ في إضافة التصنيف: ${error.message}`);
            }

            console.log('✅ Category added successfully:', data);
            res.redirect('/admin/categories');
        } catch (err) {
            console.error('❌ Server error:', err);
            res.status(500).send(`خطأ في السيرفر: ${err.message}`);
        }
    }

    async updateCategoryAdmin(req, res) {
        try {
            const { name, description, is_active } = req.body;

            if (!name) {
                return res.status(400).send('اسم التصنيف مطلوب');
            }

            const updateData = {
                name,
                description: description || '',
                is_active: is_active === 'on' || is_active === 'true' || is_active === true
            };

            if (req.file) {
                const result = await uploadToSupabase(req.file, 'categories');
                updateData.image = result ? (result.url || result) : null;
            }

            const { data, error } = await supabase.from('categories').update(updateData).eq('id', req.params.id).select().single();

            if (error) {
                console.error('❌ Supabase error:', error);
                return res.status(500).send(`خطأ في تحديث التصنيف: ${error.message}`);
            }

            if (!data) {
                return res.status(404).send('التصنيف غير موجود');
            }

            // --- Sync product assignments from the CATEGORY side ---
            // The form posts checkbox values as product_ids; empty/missing
            // means "no products in this category" (checkboxes were all
            // unchecked).
            const rawIds = req.body.product_ids;
            const selectedIds = (Array.isArray(rawIds) ? rawIds : (rawIds ? [rawIds] : []))
                .filter(id => typeof id === 'string' && id.length > 0);

            const { data: currentLinks, error: linksErr } = await supabase
                .from('product_category_links')
                .select('product_id')
                .eq('category_id', data.id);

            if (linksErr) {
                console.error('❌ Supabase error (links):', linksErr);
                return res.status(500).send(`خطأ في جلب روابط التصنيف: ${linksErr.message}`);
            }

            const currentIds = (currentLinks || []).map(l => l.product_id);
            const toAdd = selectedIds.filter(pid => !currentIds.includes(pid));
            const toRemove = currentIds.filter(pid => !selectedIds.includes(pid));

            if (toAdd.length > 0) {
                const links = toAdd.map(pid => ({ product_id: pid, category_id: data.id }));
                const { error: addErr } = await supabase.from('product_category_links').insert(links);
                if (addErr) {
                    console.error('❌ Supabase error (add links):', addErr);
                    return res.status(500).send(`خطأ في ربط المنتجات: ${addErr.message}`);
                }

                // Mirror the product-form behavior: append to category_ids and
                // fill category_id when the product has no primary category.
                const { data: addedProducts } = await supabase
                    .from('products')
                    .select('id, category_id, category_ids')
                    .in('id', toAdd);

                for (const p of (addedProducts || [])) {
                    const ids = Array.isArray(p.category_ids) ? p.category_ids : [];
                    if (!ids.includes(data.id)) {
                        const updateFields = { category_ids: [...ids, data.id] };
                        if (!p.category_id) updateFields.category_id = data.id;
                        await supabase.from('products').update(updateFields).eq('id', p.id);
                    }
                }
            }

            if (toRemove.length > 0) {
                const { error: delErr } = await supabase
                    .from('product_category_links')
                    .delete()
                    .eq('category_id', data.id)
                    .in('product_id', toRemove);
                if (delErr) {
                    console.error('❌ Supabase error (remove links):', delErr);
                    return res.status(500).send(`خطأ في إزالة المنتجات: ${delErr.message}`);
                }

                const { data: removedProducts } = await supabase
                    .from('products')
                    .select('id, category_id, category_ids, product_category_links(category_id)')
                    .in('id', toRemove);

                for (const p of (removedProducts || [])) {
                    const remaining = (p.product_category_links || []).map(l => l.category_id);
                    const ids = (Array.isArray(p.category_ids) ? p.category_ids : []).filter(cid => cid !== data.id);
                    const updateFields = { category_ids: ids };
                    if (p.category_id === data.id) {
                        updateFields.category_id = remaining[0] || null;
                    }
                    await supabase.from('products').update(updateFields).eq('id', p.id);
                }
            }

            console.log('✅ Category updated successfully:', data);
            res.redirect('/admin/categories');
        } catch (err) {
            console.error('❌ Server error:', err);
            res.status(500).send(`خطأ في السيرفر: ${err.message}`);
        }
    }

    async deleteCategoryAdmin(req, res) {
        try {
            const { error } = await supabase.from('categories').delete().eq('id', req.params.id);

            if (error) {
                console.error('❌ Supabase error:', error);
                return res.status(500).send(`خطأ في حذف التصنيف: ${error.message}`);
            }

            res.redirect('/admin/categories');
        } catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).send(`خطأ في حذف التصنيف: ${error.message}`);
        }
    }

    async reorderCategories(req, res) {
        try {
            const { categories } = req.body;

            if (!categories || !Array.isArray(categories)) {
                return res.status(400).json({ success: false, message: 'بيانات التصنيفات غير صالحة' });
            }

            const updates = categories.map(({ id, sort_order }) => {
                return supabase.from('categories').update({ sort_order: parseInt(sort_order) }).eq('id', id);
            });

            const results = await Promise.all(updates);

            const errors = results.filter(result => result.error);
            if (errors.length > 0) {
                throw new Error('فشل تحديث ترتيب التصنيفات: ' + errors.map(e => e.error.message).join(', '));
            }

            res.json({ success: true, categories });
        } catch (error) {
            console.error('ERROR in reorder route:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new CategoryController();
