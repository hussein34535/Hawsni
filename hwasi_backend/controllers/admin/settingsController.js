const { supabaseAdmin: supabase } = require('../../config/supabase');

const isHttpUrl = (value) => {
    if (!value) return true;
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

class SettingsController {
    async index(req, res) {
        try {
            const { data: settings, error } = await supabase
                .from('store_settings')
                .select('*')
                .limit(1)
                .maybeSingle();

            if (error) throw error;

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
                social_links: { facebook: '', instagram: '', whatsapp: '', tiktok: '' }
            };

            res.render('settings', {
                settings: settings || defaultSettings,
                page: 'settings',
                title: 'إعدادات المتجر',
                success: req.query.success,
                error: req.query.error
            });
        } catch (err) {
            console.error('Error loading store settings:', err);
            res.status(500).render('settings', {
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

            const cleanName = String(store_name || '').trim();
            if (!cleanName || cleanName.length > 120) {
                return res.redirect('/admin/settings?error=' + encodeURIComponent('اسم المتجر مطلوب (120 حرفًا كحد أقصى)'));
            }

            const cleanEmail = String(contact_email || '').trim();
            if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
                return res.redirect('/admin/settings?error=' + encodeURIComponent('البريد الإلكتروني غير صالح'));
            }

            const allowedCurrencies = ['EGP', 'USD', 'SAR', 'AED'];
            const cleanCurrency = allowedCurrencies.includes(currency) ? currency : 'EGP';
            const cleanPixel = String(meta_pixel_id || '').trim();
            if (cleanPixel && !/^\d{5,30}$/.test(cleanPixel)) {
                return res.redirect('/admin/settings?error=' + encodeURIComponent('Meta Pixel ID يجب أن يكون أرقامًا فقط'));
            }

            const urls = { logo_url, facebook, instagram, tiktok };
            for (const [field, value] of Object.entries(urls)) {
                if (value && !isHttpUrl(String(value).trim())) {
                    return res.redirect('/admin/settings?error=' + encodeURIComponent(`رابط ${field} غير صالح`));
                }
            }

            const settingsData = {
                store_name: cleanName,
                store_description: String(store_description || '').trim().slice(0, 2000),
                logo_url: String(logo_url || '').trim(),
                contact_email: cleanEmail,
                contact_phone: String(contact_phone || '').trim().slice(0, 40),
                address: String(address || '').trim().slice(0, 300),
                currency: cleanCurrency,
                social_links: {
                    facebook: String(facebook || '').trim().slice(0, 500),
                    instagram: String(instagram || '').trim().slice(0, 500),
                    whatsapp: String(whatsapp || '').trim().slice(0, 60),
                    tiktok: String(tiktok || '').trim().slice(0, 500)
                },
                meta_pixel_id: cleanPixel,
                free_delivery_enabled: req.body.free_delivery_enabled === 'on',
                updated_at: new Date().toISOString()
            };

            const { data: existing, error: findError } = await supabase
                .from('store_settings')
                .select('id')
                .limit(1)
                .maybeSingle();
            if (findError) throw findError;

            const { error: saveError } = existing
                ? await supabase.from('store_settings').update(settingsData).eq('id', existing.id)
                : await supabase.from('store_settings').insert(settingsData);
            if (saveError) throw saveError;

            res.redirect('/admin/settings?success=1');
        } catch (err) {
            console.error('Error updating store settings:', err);
            res.redirect('/admin/settings?error=' + encodeURIComponent('تعذر حفظ الإعدادات. حاول مرة أخرى.'));
        }
    }

    async getSettingsApi(req, res) {
        try {
            const { data: settings, error } = await supabase
                .from('store_settings')
                .select('*')
                .limit(1)
                .maybeSingle();
            if (error) throw error;

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
            res.status(500).json({ success: false, message: 'تعذر تحميل الإعدادات' });
        }
    }
}

module.exports = new SettingsController();
