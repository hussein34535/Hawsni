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
                .single();

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        res.redirect('/banners');
    } catch(err) {
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
            .delete ()
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
