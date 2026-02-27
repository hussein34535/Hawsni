const axios = require('axios');
const supabase = require('../config/supabase');

class MetaService {
    constructor() {
        this.pixelId = '917878230740262';
        this.accessToken = process.env.META_ACCESS_TOKEN;
        this.apiUrl = `https://graph.facebook.com/v18.0/${this.pixelId}/events`;
    }

    async trackPurchase(order, customerInfo) {
        if (!this.accessToken) {
            console.warn('⚠️ Meta Access Token is missing. Skipping CAPI Purchase event.');
            return;
        }

        try {
            const userData = {
                em: customerInfo.email ? [this.hashData(customerInfo.email.toLowerCase())] : undefined,
                ph: customerInfo.phone ? [this.hashData(customerInfo.phone.replace(/\D/g, ''))] : undefined,
                fn: customerInfo.name ? [this.hashData(customerInfo.name.split(' ')[0].toLowerCase())] : undefined,
                ln: customerInfo.name ? [this.hashData(customerInfo.name.split(' ').slice(1).join(' ').toLowerCase())] : undefined,
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

            const response = await axios.post(this.apiUrl, eventData);
            console.log('✅ Meta CAPI Purchase event sent:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Meta CAPI Error:', error.response?.data || error.message);
        }
    }

    hashData(data) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}

module.exports = new MetaService();
