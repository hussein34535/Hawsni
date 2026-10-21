const { supabaseAdmin: supabase } = require('../../config/supabase');

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

class ShippingController {
    async index(req, res) {
        try {
            const { data: settingsArray, error } = await supabase
                .from('shipping_settings')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(1);
            if (error) throw error;

            const settings = settingsArray?.[0] || null;
            const defaultSettings = {
                delivery_cost: 0,
                free_shipping_threshold: 0,
                default_days_min: 3,
                default_days_max: 7,
                governorate_settings: {}
            };

            res.render('shipping-settings', {
                settings: settings || defaultSettings,
                page: 'shipping',
                success: req.query.success,
                error: req.query.error
            });
        } catch (err) {
            console.error('Error loading shipping settings:', err);
            res.status(500).render('shipping-settings', {
                settings: {
                    delivery_cost: 0,
                    free_shipping_threshold: 0,
                    default_days_min: 3,
                    default_days_max: 7,
                    governorate_settings: {}
                },
                page: 'shipping',
                error: 'حدث خطأ أثناء تحميل إعدادات الشحن'
            });
        }
    }

    async getSettings(req, res) {
        try {
            const { data: settingsArray, error } = await supabase
                .from('shipping_settings')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(1);
            if (error) throw error;

            res.json({
                success: true,
                settings: settingsArray?.[0] || {
                    delivery_cost: 0,
                    free_shipping_threshold: 0,
                    default_days_min: 3,
                    default_days_max: 7,
                    governorate_settings: {}
                }
            });
        } catch (err) {
            res.json({
                success: true,
                settings: {
                    delivery_cost: 0,
                    free_shipping_threshold: 0,
                    default_days_min: 3,
                    default_days_max: 7,
                    governorate_settings: {}
                }
            });
        }
    }

    async update(req, res) {
        try {
            const deliveryCost = toNumber(req.body.delivery_cost, 0);
            const freeThreshold = toNumber(req.body.free_shipping_threshold, 0);
            let daysMin = Math.round(toNumber(req.body.default_days_min, 3));
            let daysMax = Math.round(toNumber(req.body.default_days_max, 7));

            if (deliveryCost < 0 || freeThreshold < 0) {
                return res.redirect('/admin/shipping?error=' + encodeURIComponent('قيم الشحن لا يمكن أن تكون سالبة'));
            }
            daysMin = Math.min(Math.max(daysMin || 3, 1), 30);
            daysMax = Math.min(Math.max(daysMax || 7, 1), 30);
            if (daysMax < daysMin) [daysMin, daysMax] = [daysMax, daysMin];

            const governorateSettings = {};
            const govNames = req.body.gov_name || [];
            const govCosts = req.body.gov_cost || [];
            const govDaysMin = req.body.gov_days_min || [];
            const govDaysMax = req.body.gov_days_max || [];

            const names = Array.isArray(govNames) ? govNames : [govNames];
            const costs = Array.isArray(govCosts) ? govCosts : [govCosts];
            const minDays = Array.isArray(govDaysMin) ? govDaysMin : [govDaysMin];
            const maxDays = Array.isArray(govDaysMax) ? govDaysMax : [govDaysMax];

            names.forEach((name, i) => {
                const cleanName = String(name || '').trim().slice(0, 80);
                if (!cleanName || governorateSettings[cleanName]) return;
                let min = Math.min(Math.max(Math.round(toNumber(minDays[i], 3)) || 3, 1), 30);
                let max = Math.min(Math.max(Math.round(toNumber(maxDays[i], 7)) || 7, 1), 30);
                if (max < min) [min, max] = [max, min];
                governorateSettings[cleanName] = {
                    cost: Math.max(toNumber(costs[i], 0), 0),
                    days_min: min,
                    days_max: max
                };
            });

            const settingsData = {
                delivery_cost: deliveryCost,
                free_shipping_threshold: freeThreshold,
                default_days_min: daysMin,
                default_days_max: daysMax,
                governorate_settings: governorateSettings,
                updated_at: new Date().toISOString()
            };

            const { data: existingArray, error: findError } = await supabase
                .from('shipping_settings')
                .select('id')
                .order('updated_at', { ascending: false })
                .limit(1);
            if (findError) throw findError;

            const existing = existingArray?.[0] || null;
            const { error: saveError } = existing
                ? await supabase.from('shipping_settings').update(settingsData).eq('id', existing.id)
                : await supabase.from('shipping_settings').insert(settingsData);
            if (saveError) throw saveError;

            res.redirect('/admin/shipping?success=1');
        } catch (err) {
            console.error('Error saving shipping settings:', err);
            res.redirect('/admin/shipping?error=' + encodeURIComponent('تعذر حفظ إعدادات الشحن. حاول مرة أخرى.'));
        }
    }
}

module.exports = new ShippingController();
