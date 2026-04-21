const fetch = require('node-fetch');
const crypto = require('crypto');
const supabase = require('../config/supabase');

class MetaService {
    constructor() {
        this.defaultPixelId = process.env.META_PIXEL_ID || '917878230740262';
        this.accessToken = process.env.META_ACCESS_TOKEN;
    }

    /**
     * Hashing function for Advanced Matching as required by Meta
     * @param {string} data - Plain text data to be hashed
     * @returns {string|null} - SHA-256 hashed string or null
     */
    hashData(data) {
        if (!data) return null;
        return crypto
            .createHash('sha256')
            .update(data.toString().toLowerCase().trim())
            .digest('hex');
    }

    /**
     * Fetches the active Pixel ID from store_settings table
     * @returns {Promise<string|null>}
     */
    async getActivePixelId() {
        try {
            const { data: settings } = await supabase
                .from('store_settings')
                .select('meta_pixel_id')
                .single();

            return settings?.meta_pixel_id || this.defaultPixelId;
        } catch (err) {
            console.warn('⚠️ MetaService: Failed to fetch pixel_id from DB, using fallback.');
            return this.defaultPixelId;
        }
    }

    async trackPurchase(order, customerInfo) {
        if (!this.accessToken) {
            console.warn('⚠️ Meta Access Token is missing. Skipping CAPI Purchase event.');
            return;
        }

        const pixelId = await this.getActivePixelId();
        if (!pixelId) {
            console.error('❌ No Meta Pixel ID configured. Skipping CAPI event.');
            return;
        }

        try {
            const apiUrl = `https://graph.facebook.com/v18.0/${pixelId}/events`;

            // Advanced Matching (Hashed User Data)
            const userData = {
                em: customerInfo.email ? [this.hashData(customerInfo.email)] : undefined,
                ph: customerInfo.phone ? [this.hashData(customerInfo.phone.replace(/\D/g, ''))] : undefined,
                fn: customerInfo.name ? [this.hashData(customerInfo.name.split(' ')[0])] : undefined,
                ln: customerInfo.name ? [this.hashData(customerInfo.name.split(' ').slice(1).join(' '))] : undefined,
                client_ip_address: customerInfo.ip,
                client_user_agent: customerInfo.userAgent,
            };

            const eventData = {
                data: [
                    {
                        event_name: 'Purchase',
                        event_time: Math.floor(Date.now() / 1000),
                        action_source: 'website',
                        event_id: `order_${order.id}`,
                        event_source_url: 'https://hawsni.com/checkout/success',
                        user_data: userData,
                        custom_data: {
                            value: order.total_amount || order.total,
                            currency: 'EGP',
                            content_ids: order.items ? order.items.map(item => item.product_id) : [],
                            content_type: 'product',
                            num_items: order.items ? order.items.reduce((acc, item) => acc + item.quantity, 0) : 0
                        }
                    }
                ],
                access_token: this.accessToken
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });

            const result = await response.json();
            
            if (result.error) {
                console.error('❌ Meta CAPI API Error:', result.error.message);
            } else {
                console.log(`✅ Meta CAPI Purchase event sent to Pixel [${pixelId}]:`, result);
            }
            
            return result;
        } catch (error) {
            console.error('❌ Meta CAPI System Error:', error.message);
        }
    }
}

module.exports = new MetaService();
