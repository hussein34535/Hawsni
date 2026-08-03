const supabase = require('../config/supabase');

class BannerService {
    async getBanners() {
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw new Error(error.message);
        return data;
    }

    async createBanner(bannerData) {
        const { data, error } = await supabase
            .from('banners')
            .insert([bannerData])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }
}

module.exports = new BannerService();
