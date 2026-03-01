const supabase = require('../../config/supabase');

class ShippingController {
    // Render shipping settings page
    async index(req, res) {
        try {
            const { data: settingsArray } = await supabase
                .from('shipping_settings')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(1);

            const settings = settingsArray && settingsArray.length > 0 ? settingsArray[0] : null;

            const defaultSettings = {
                delivery_cost: 0,
                free_shipping_threshold: 0,
                default_days_min: 3,
                default_days_max: 7,
                governorate_settings: {}
            };

            res.render('shipping-settings', {
                settings: settings || defaultSettings,
                page: 'shipping'
            });
        } catch (err) {
            console.error('Error loading shipping settings:', err);
            res.render('shipping-settings', {
                settings: {
                    delivery_cost: 0,
                    free_shipping_threshold: 0,
                    default_days_min: 3,
                    default_days_max: 7,
                    governorate_settings: {}
                },
                page: 'shipping'
            });
        }
    }

    // Public JSON API for Flutter
    async getSettings(req, res) {
        try {
            const { data: settingsArray } = await supabase
                .from('shipping_settings')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(1);

            const settings = settingsArray && settingsArray.length > 0 ? settingsArray[0] : null;

            res.json({
                success: true,
                settings: settings || {
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

    // Save shipping settings
    async update(req, res) {
        try {
            const {
                delivery_cost,
                free_shipping_threshold,
                default_days_min,
                default_days_max
            } = req.body;

            // Parse governorate overrides from form
            const governorateSettings = {};
            const govNames = req.body.gov_name || [];
            const govCosts = req.body.gov_cost || [];
            const govDaysMin = req.body.gov_days_min || [];
            const govDaysMax = req.body.gov_days_max || [];

            const names = Array.isArray(govNames) ? govNames : [govNames];
            const costs = Array.isArray(govCosts) ? govCosts : [govCosts];
            const daysMin = Array.isArray(govDaysMin) ? govDaysMin : [govDaysMin];
            const daysMax = Array.isArray(govDaysMax) ? govDaysMax : [govDaysMax];

            names.forEach((name, i) => {
                if (name && name.trim()) {
                    governorateSettings[name.trim()] = {
                        cost: parseFloat(costs[i]) || 0,
                        days_min: parseInt(daysMin[i]) || 3,
                        days_max: parseInt(daysMax[i]) || 7
                    };
                }
            });

            const settingsData = {
                delivery_cost: parseFloat(delivery_cost) || 0,
                free_shipping_threshold: parseFloat(free_shipping_threshold) || 0,
                default_days_min: parseInt(default_days_min) || 3,
                default_days_max: parseInt(default_days_max) || 7,
                governorate_settings: governorateSettings,
                updated_at: new Date().toISOString()
            };

            // Upsert (insert or update the single settings row)
            const { data: existingArray } = await supabase
                .from('shipping_settings')
                .select('id')
                .order('updated_at', { ascending: false })
                .limit(1);

            const existing = existingArray && existingArray.length > 0 ? existingArray[0] : null;

            if (existing) {
                await supabase
                    .from('shipping_settings')
                    .update(settingsData)
                    .eq('id', existing.id);
            } else {
                await supabase
                    .from('shipping_settings')
                    .insert(settingsData);
            }

            res.redirect('/shipping');
        } catch (err) {
            console.error('Error saving shipping settings:', err);
            res.status(500).send('خطأ في حفظ إعدادات الشحن: ' + err.message);
        }
    }
}

module.exports = new ShippingController();
