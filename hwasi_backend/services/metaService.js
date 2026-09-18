const fetch = require('node-fetch');
const crypto = require('crypto');
const supabase = require('../config/supabase');

class MetaService {
    constructor() {
        this.defaultPixelId = process.env.META_PIXEL_ID || '917878230740262';
        this.accessToken = process.env.META_ACCESS_TOKEN;
        // Meta deprecates Graph API versions ~2 years after release. v18.0
        // (2023) is dead — keep this configurable and default to a live one.
        this.apiVersion = process.env.META_API_VERSION || 'v23.0';
        this.warnedMissingToken = false;
    }

    /**
     * True when server-side Conversions API is configured.
     * When false, only the browser pixel tracks purchases — which loses every
     * ad-blocker / iOS / ITP user and starves Meta's ad optimization.
     */
    isConfigured() {
        return Boolean(this.accessToken);
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
            // Log loudly but only once per instance so logs stay readable —
            // this silently disabled tracking for every order before.
            if (!this.warnedMissingToken) {
                console.error('❌ [Meta CAPI] META_ACCESS_TOKEN is NOT configured — server-side Purchase tracking is DISABLED. Meta only sees browser-pixel events (blocked on ad-blockers/iOS), which inflates cost-per-result and stalls ad delivery. Add META_ACCESS_TOKEN in the backend environment.');
                this.warnedMissingToken = true;
            }
            return { skipped: true, reason: 'META_ACCESS_TOKEN_MISSING' };
        }

        const pixelId = await this.getActivePixelId();
        if (!pixelId) {
            console.error('❌ No Meta Pixel ID configured. Skipping CAPI event.');
            return { skipped: true, reason: 'PIXEL_ID_MISSING' };
        }

        try {
            const apiUrl = `https://graph.facebook.com/${this.apiVersion}/${pixelId}/events`;

            // Advanced Matching (hashed user data). fbp/fbc are the browser
            // cookies Meta uses to stitch the server event to the click/session
            // — including them raises Event Match Quality significantly.
            const userData = {
                em: customerInfo.email ? [this.hashData(customerInfo.email)] : undefined,
                ph: customerInfo.phone ? [this.hashData(customerInfo.phone.replace(/\D/g, ''))] : undefined,
                fn: customerInfo.name ? [this.hashData(customerInfo.name.split(' ')[0])] : undefined,
                ln: customerInfo.name ? [this.hashData(customerInfo.name.split(' ').slice(1).join(' '))] : undefined,
                client_ip_address: customerInfo.ip,
                client_user_agent: customerInfo.userAgent,
                fbp: customerInfo.fbp || undefined,
                fbc: customerInfo.fbc || undefined,
            };

            // Drop undefined keys — Meta rejects null-ish entries in some SDKs
            Object.keys(userData).forEach(k => userData[k] === undefined && delete userData[k]);

            const items = order.items || [];
            const eventData = {
                data: [
                    {
                        event_name: 'Purchase',
                        event_time: Math.floor(Date.now() / 1000),
                        action_source: 'website',
                        // Use frontend eventId for deduplication with Browser Pixel, fallback to order id
                        event_id: customerInfo.eventId || `order_${order.id}`,
                        event_source_url: 'https://hwasi.com/checkout',
                        user_data: userData,
                        custom_data: {
                            value: order.total_amount || order.total,
                            currency: 'EGP',
                            content_ids: items.map(item => item.product_id).filter(Boolean),
                            content_type: 'product',
                            num_items: items.reduce((acc, item) => acc + (item.quantity || 0), 0)
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
                console.error(`❌ [Meta CAPI] API error (${this.apiVersion}):`, result.error.message);
                // Version deprecation is a silent killer — surface it explicitly
                if (/version|deprecat/i.test(result.error.message || '')) {
                    console.error(`❌ [Meta CAPI] Graph API ${this.apiVersion} looks deprecated — set META_API_VERSION to a current version.`);
                }
            } else {
                console.log(`✅ Meta CAPI Purchase event sent to Pixel [${pixelId}] (${this.apiVersion}):`, JSON.stringify(result));
            }

            return result;
        } catch (error) {
            console.error('❌ Meta CAPI System Error:', error.message);
            return { error: error.message };
        }
    }
}

module.exports = new MetaService();
