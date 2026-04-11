const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const supabase = require('../config/supabase');

const BOSTA_API_KEY = process.env.BOSTA_API_KEY;
const BOSTA_BASE_URL = 'https://api.bosta.co/api/v0';

class BostaService {
    /**
     * Create a new shipment (Delivery) in Bosta
     * @param {Object} orderData The mapped order data from Hawsni
     */
    async createShipment(orderData) {
        try {
            console.log(`[Bosta] Creating shipment for order ${orderData.order_number}...`);
            
            // Map Hawsni structure to Bosta expected structure
            let shippingAddress = orderData.shipping_address;
            if (typeof shippingAddress === 'string') {
                try {
                    shippingAddress = JSON.parse(shippingAddress);
                } catch (e) {
                    console.error('Failed to parse shipping address', e);
                }
            }

            const customerName = orderData.users?.name || shippingAddress.name || 'عميل هوسي';
            const customerPhone = orderData.users?.phone || shippingAddress.phone || '';
            const city = shippingAddress.state || 'Cairo';
            const address = shippingAddress.street || 'لا يوجد عنوان تفصيلي';

            const payload = {
                type: 10, // 10 is Package Delivery depending on Bosta docs
                specs: {
                    packageDetails: {
                        itemsCount: orderData.order_items?.length || 1,
                        description: `Hawsni Order #${orderData.order_number}`
                    }
                },
                notes: orderData.notes || 'لا يوجد ملاحظات',
                cod: parseFloat(orderData.total), // Cash on Delivery amount
                dropOffAddress: {
                    city: city, // Needs to match Bosta's city list eventually, but string mapping is mostly okay.
                    firstLine: address,
                },
                receiver: {
                    firstName: customerName.split(' ')[0] || 'Customer',
                    lastName: customerName.split(' ').slice(1).join(' ') || 'Hawsni',
                    phone: customerPhone,
                },
                businessReference: String(orderData.order_number || orderData.id)
            };

            const response = await fetch(`${BOSTA_BASE_URL}/deliveries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${BOSTA_API_KEY}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('[Bosta] Error response:', data);
                throw new Error(data.message || 'Failed to create Bosta shipment');
            }

            console.log(`[Bosta] Successfully created shipment: Tracking # ${data.trackingNumber}`);

            // Save tracking number and bosta_id in our database
            const { error: updateError } = await supabase
                .from('orders')
                .update({ 
                    tracking_number: data.trackingNumber,
                    bosta_id: data._id
                })
                .eq('id', orderData.id);

            if (updateError) {
                console.error('[Bosta] Failed to update order with tracking info:', updateError);
            }

            return {
                success: true,
                trackingNumber: data.trackingNumber,
                bostaId: data._id
            };
        } catch (error) {
            console.error('[Bosta] Error creating shipment:', error);
            throw error;
        }
    }

    /**
     * Get the AWB (Air Waybill) PDF link for a delivery
     * @param {string} deliveryId Bosta internal ID
     */
    async getAWB(deliveryId) {
        try {
            const response = await fetch(`${BOSTA_BASE_URL}/deliveries/awb/${deliveryId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `${BOSTA_API_KEY}`
                }
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to get AWB');
            }

            return data.data; // Usually returns binary or a url
        } catch (error) {
            console.error('[Bosta] Error getting AWB:', error);
            throw error;
        }
    }
}

module.exports = new BostaService();
