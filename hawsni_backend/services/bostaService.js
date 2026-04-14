const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const supabase = require('../config/supabase');

const BOSTA_API_KEY = process.env.BOSTA_API_KEY;
const BOSTA_BASE_URL = 'https://api.bosta.co/api/v0';

class BostaService {
    /**
     * Create a new shipment (Delivery) in Bosta
     * @param {Object} orderData The mapped order data from Hawsni
     */
    async createShipment(orderData, options = {}) {
        try {
            console.log(`[Bosta] Creating shipment for order ${orderData.order_number || orderData.id}...`);
            
            // Map Hawsni structure to Bosta expected structure
            let shippingAddress = orderData.shipping_address;
            let city = 'القاهرة';
            let address = 'لا يوجد عنوان تفصيلي';

            if (typeof shippingAddress === 'string') {
                if (shippingAddress.trim().startsWith('{')) {
                    try {
                        shippingAddress = JSON.parse(shippingAddress);
                    } catch (e) {
                        console.error('Failed to parse shipping address', e);
                    }
                } else if (shippingAddress.includes(',')) {
                    // Legacy string format fallback
                    let parts = shippingAddress.split(',').map(s => s.trim());
                    if (parts.length >= 2) {
                        city = parts[parts.length - 1]; // Governorates usually last
                        address = parts.slice(0, parts.length - 1).join(' - ');
                    } else {
                        address = shippingAddress;
                    }
                }
            }

            if (typeof shippingAddress === 'object' && shippingAddress !== null) {
                city = shippingAddress.state || shippingAddress.city || city;
                address = shippingAddress.street || shippingAddress.address || address;
            }

            const customerName = orderData.users?.name || (typeof shippingAddress === 'object' ? shippingAddress.name : null) || 'عميل هوسي';
            const customerPhone = orderData.users?.phone || (typeof shippingAddress === 'object' ? shippingAddress.phone : null) || '';

            const payload = {
                type: 10, // Package Delivery
                specs: {
                    size: options.size || 'MEDIUM',
                    packageDetails: {
                        itemsCount: orderData.order_items?.length || 1,
                        description: `Hawsni Order #${orderData.order_number || orderData.id}`
                    }
                },
                notes: orderData.notes || 'لا يوجد ملاحظات',
                cod: parseFloat(orderData.total), // Cash on Delivery amount
                dropOffAddress: {
                    city: city,
                    firstLine: address,
                },
                allowToOpenPackage: options.allowToOpenPackage !== undefined ? options.allowToOpenPackage : true,
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
