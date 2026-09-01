const supabase = require('../config/supabase');

// Banner crop/responsive config is stored self-contained in `subtitle`
// as JSON: {"_cfg":{fx,fy,bo,bl,mi,mfx,mfy,ti,tfx,tfy}}
// This works with ZERO schema changes; unwrapBannerConfig() merges it
// into the banner object for the storefront / edit form.
function unwrapBannerConfig(row) {
    let cfg = null;
    if (row.subtitle && row.subtitle.trim().startsWith('{')) {
        try {
            const p = JSON.parse(row.subtitle);
            if (p && p._cfg) cfg = p._cfg;
        } catch (e) { /* not a config payload */ }
    }
    const banner = { ...row, subtitle: null };
    if (cfg) {
        banner.focal_x = cfg.fx ?? 50;
        banner.focal_y = cfg.fy ?? 50;
        banner.button_opacity = cfg.bo ?? 1;
        banner.image_blur = cfg.bl ?? 0;
        banner.mobile_image_url = cfg.mi || null;
        banner.mobile_focal_x = cfg.mfx ?? 50;
        banner.mobile_focal_y = cfg.mfy ?? 50;
        banner.tablet_image_url = cfg.ti || null;
        banner.tablet_focal_x = cfg.tfx ?? 50;
        banner.tablet_focal_y = cfg.tfy ?? 50;
    }
    return banner;
}

function buildConfigJson(body) {
    const clamp = (v, min, max, d) => Math.min(max, Math.max(min, isNaN(parseFloat(v)) ? d : parseFloat(v)));
    return {
        _cfg: {
            fx: clamp(body.focal_x, 0, 100, 50),
            fy: clamp(body.focal_y, 0, 100, 50),
            bo: clamp(body.button_opacity, 0, 1, 1),
            bl: clamp(body.image_blur, 0, 20, 0),
            mi: (body.mobile_image_url || '').trim() || null,
            mfx: clamp(body.mobile_focal_x, 0, 100, 50),
            mfy: clamp(body.mobile_focal_y, 0, 100, 50),
            ti: (body.tablet_image_url || '').trim() || null,
            tfx: clamp(body.tablet_focal_x, 0, 100, 50),
            tfy: clamp(body.tablet_focal_y, 0, 100, 50)
        }
    };
}

class BannerService {
    async getBanners() {
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw new Error(error.message);
        return (data || []).map(unwrapBannerConfig);
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
module.exports.unwrapBannerConfig = unwrapBannerConfig;
module.exports.buildConfigJson = buildConfigJson;
