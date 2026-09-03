const supabase = require('../../config/supabase');

class SettingsController {
    // Render settings page
    async index(req, res) {
        try {
            const { data: settings } = await supabase
                .from('store_settings')
                .select('*')
                .single();

            const defaultSettings = {
                store_name: 'Hwasi Store',
                store_description: '',
                logo_url: '',
                contact_email: '',
                contact_phone: '',
                address: '',
                currency: 'EGP',
                meta_pixel_id: '',
                free_delivery_enabled: false,
                social_links: {
                    facebook: '',
                    instagram: '',
                    whatsapp: '',
                    tiktok: ''
                }
            };

            res.render('settings', {
                settings: settings || defaultSettings,
                page: 'settings',
                title: 'إعدادات المتجر'
            });
        } catch (err) {
            console.error('Error loading store settings:', err);
            res.render('settings', {
                settings: {
                    store_name: 'Hwasi Store',
                    social_links: {}
                },
                page: 'settings',
                title: 'إعدادات المتجر',
                error: 'حدث خطأ أثناء تحميل الإعدادات'
            });
        }
    }

    // Update settings
    async update(req, res) {
        try {
            const {
                store_name,
                store_description,
                logo_url,
                contact_email,
                contact_phone,
                address,
                currency,
                facebook,
                instagram,
                whatsapp,
                tiktok,
                meta_pixel_id
            } = req.body;

            const settingsData = {
                store_name,
                store_description,
                logo_url,
                contact_email,
                contact_phone,
                address,
                currency,
                social_links: {
                    facebook,
                    instagram,
                    whatsapp,
                    tiktok
                },
                meta_pixel_id,
                free_delivery_enabled: req.body.free_delivery_enabled === 'on',
                updated_at: new Date().toISOString()
            };

            // Check if settings exist
            const { data: existing } = await supabase
                .from('store_settings')
                .select('id')
                .single();

            if (existing) {
                await supabase
                    .from('store_settings')
                    .update(settingsData)
                    .eq('id', existing.id);
            } else {
                await supabase
                    .from('store_settings')
                    .insert(settingsData);
            }

            res.redirect('/admin/settings');
        } catch (err) {
            console.error('Error updating store settings:', err);
            res.status(500).send('خطأ في حفظ الإعدادات');
        }
    }

    // API to get public settings (for Flutter app)
    async getSettingsApi(req, res) {
        try {
            const { data: settings } = await supabase
                .from('store_settings')
                .select('*')
                .single();

            // Payment instructions use the same operating values as the WhatsApp
            // deposit flow unless overridden with environment variables.
            const configuredDeposit = parseFloat(process.env.PAYMENT_VODAFONE_DEPOSIT_AMOUNT);
            res.json({
                success: true,
                data: settings,
                payment: {
                    vodafoneWalletNumber: process.env.PAYMENT_VODAFONE_WALLET_NUMBER || '01038588564',
                    vodafoneDepositAmount: Number.isFinite(configuredDeposit) ? configuredDeposit : 70,
                    whatsappNumber: settings?.social_links?.whatsapp || null
                }
            });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
}

module.exports = new SettingsController();
