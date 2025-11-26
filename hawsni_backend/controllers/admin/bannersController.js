const supabase = require('../../config/supabase');

class BannersController {
    // List all banners
    async index(req, res) {
        try {
            const { data: banners, error } = await supabase
                .from('banners')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;

            res.render('banners', { banners });
        } catch (err) {
            console.error('Error fetching banners:', err);
            res.status(500).send('خطأ في تحميل البنرات');
        }
    }

    // Show create form
    async new(req, res) {
        res.render('banner-form', { banner: null });
    }

    // Create a new banner
    async create(req, res) {
        try {
            const {
                title, image_url, link, sort_order, is_active,
                heading_text, subheading_text,
                button_text, button_color, button_style, button_size, button_position, button_link
            } = req.body;
            let finalImageUrl = image_url;

            // If file was uploaded, upload to Supabase Storage
            if (req.file) {
                const fileName = `banner-${Date.now()}-${req.file.originalname}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('banners')
                    .upload(fileName, req.file.buffer, {
                        contentType: req.file.mimetype,
                        cacheControl: '3600'
                    });

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    throw uploadError;
                }

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('banners')
                    .getPublicUrl(fileName);

                finalImageUrl = publicUrl;
            }

            // Validate we have an image URL
            if (!finalImageUrl || finalImageUrl.trim() === '') {
                return res.status(400).send('يجب رفع صورة أو إدخال رابط الصورة');
            }

            const bannerData = {
                title: title || null,
                image_url: finalImageUrl.trim(),
                link: link || null,
                sort_order: parseInt(sort_order) || 1,
                is_active: is_active === 'true',
                // Text content
                heading_text: heading_text || null,
                subheading_text: subheading_text || null,
                // Button customization
                button_text: button_text,
                button_color: button_color || '#D4AF37',
                button_style: button_style || 'rounded',
                button_size: button_size || 'medium',
                button_position: button_position || 'right',
                button_link: button_link || null
            };

            const { data, error } = await supabase
                .from('banners')
                .insert([bannerData])
                .select()
                .single();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            res.redirect('/banners');
        } catch (err) {
            console.error('Error creating banner:', err);
            res.status(500).send('خطأ في إضافة البنر: ' + err.message);
        }
    }

    // Show edit form
    async edit(req, res) {
        try {
            const { id } = req.params;

            const { data: banner, error } = await supabase
                .from('banners')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (!banner) {
                return res.status(404).send('البنر غير موجود');
            }

            res.render('banner-form', { banner });
        } catch (err) {
            console.error('Error fetching banner:', err);
            res.status(500).send('خطأ في تحميل البنر');
        }
    }

    // Update an existing banner
    async update(req, res) {
        try {
            const { id } = req.params;
            const {
                title, image_url, link, sort_order, is_active,
                heading_text, subheading_text,
                button_text, button_color, button_style, button_size, button_position, button_link
            } = req.body;
            let finalImageUrl = image_url;

            // If file was uploaded, upload to Supabase Storage
            if (req.file) {
                const fileName = `banner-${Date.now()}-${req.file.originalname}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('banners')
                    .upload(fileName, req.file.buffer, {
                        contentType: req.file.mimetype,
                        cacheControl: '3600'
                    });

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    throw uploadError;
                }

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('banners')
                    .getPublicUrl(fileName);

                finalImageUrl = publicUrl;
            }

            // Validate we have an image URL
            if (!finalImageUrl || finalImageUrl.trim() === '') {
                return res.status(400).send('يجب رفع صورة أو إدخال رابط الصورة');
            }

            const updateData = {
                title: title || null,
                image_url: finalImageUrl.trim(),
                link: link || null,
                sort_order: parseInt(sort_order) || 1,
                is_active: is_active === 'true',
                // Text content
                heading_text: heading_text || null,
                subheading_text: subheading_text || null,
                // Button customization
                button_text: button_text,
                button_color: button_color || '#D4AF37',
                button_style: button_style || 'rounded',
                button_size: button_size || 'medium',
                button_position: button_position || 'right',
                button_link: button_link || null
            };

            const { data, error } = await supabase
                .from('banners')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            res.redirect('/banners');
        } catch (err) {
            console.error('Error updating banner:', err);
            res.status(500).send('خطأ في تحديث البنر: ' + err.message);
        }
    }

    // Delete a banner
    async delete(req, res) {
        try {
            const { id } = req.params;

            const { error } = await supabase
                .from('banners')
                .delete()
                .eq('id', id);

            if (error) throw error;

            res.json({ success: true });
        } catch (err) {
            console.error('Error deleting banner:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

module.exports = new BannersController();
