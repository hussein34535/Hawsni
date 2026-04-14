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
            
            // Default fallback
            let city = 'القاهرة';
            let address = 'لا يوجد عنوان تفصيلي';
            let extractedName = null;
            let extractedPhone = null;

            if (shippingAddress) {
                // If it is a string that looks like JSON, parse it
                if (typeof shippingAddress === 'string' && shippingAddress.trim().startsWith('{')) {
                    try {
                        shippingAddress = JSON.parse(shippingAddress);
                    } catch (e) {
                        console.error('Failed to parse shipping address string to JSON', e);
                    }
                }

                if (typeof shippingAddress === 'object' && shippingAddress !== null) {
                    // It's an object!
                    extractedName = shippingAddress.name;
                    extractedPhone = shippingAddress.phone;
                    
                    // Does it have structured state/city/street?
                    if (shippingAddress.state || shippingAddress.city) {
                        city = shippingAddress.state || shippingAddress.city;
                        address = shippingAddress.street || shippingAddress.address || address;
                    } 
                    // Or does it just have a concatenated 'address' string?
                    else if (shippingAddress.address && typeof shippingAddress.address === 'string') {
                        let parts = shippingAddress.address.split(',').map(s => s.trim());
                        if (parts.length >= 2) {
                            city = parts[parts.length - 1]; // Governorate is usually last
                            address = parts.slice(0, parts.length - 1).join(' - ');
                        } else {
                            address = shippingAddress.address;
                        }
                    }
                } else if (typeof shippingAddress === 'string') {
                    // Legacy naked string format
                    let parts = shippingAddress.split(',').map(s => s.trim());
                    if (parts.length >= 2) {
                        city = parts[parts.length - 1];
                        address = parts.slice(0, parts.length - 1).join(' - ');
                    } else {
                        address = shippingAddress;
                    }
                }
            }

            const customerName = orderData.users?.name || extractedName || 'عميل هوسي';
            const customerPhone = orderData.users?.phone || extractedPhone || '';
            
            // Extract Product Names for Description
            let productNames = [];
            if (orderData.order_items && orderData.order_items.length > 0) {
                productNames = orderData.order_items.map(item => {
                    const p = item.products;
                    return p && p.name ? p.name : (item.name || `Product ${item.product_id}`);
                });
            }
            
            let description = productNames.length > 0 ? productNames.join(' + ') : `Hawsni Order #${orderData.order_number || orderData.id}`;
            // Limit to avoid Bosta validation error if characters exceed limit
            if (description.length > 200) {
                description = description.substring(0, 197) + '...';
            }

            const payload = {
                type: 10, // Package Delivery
                specs: {
                    size: options.size || 'MEDIUM',
                    packageDetails: {
                        itemsCount: orderData.order_items?.length || 1,
                        description: description
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
