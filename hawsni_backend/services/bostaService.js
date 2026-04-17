const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const supabase = require('../config/supabase');

const BOSTA_API_KEY = process.env.BOSTA_API_KEY;
const BOSTA_BASE_URL = 'https://api.bosta.co/api/v0';

// Bosta City Map: Arabic/English names -> { _id, name }
// Source: GET /api/v0/cities + manual Arabic aliases from Hawsni addresses
const BOSTA_CITIES_MAP = {
    // Arabic governorate names
    'الاسكندرية': { _id: 'Jrb6X6ucjiYgMP4T7', name: 'Alexandria' },
    'الإسكندرية': { _id: 'Jrb6X6ucjiYgMP4T7', name: 'Alexandria' },
    'اسكندرية': { _id: 'Jrb6X6ucjiYgMP4T7', name: 'Alexandria' },
    'أسيوط': { _id: '7mDPAohM3ArSZmWTm', name: 'Assuit' },
    'اسيوط': { _id: '7mDPAohM3ArSZmWTm', name: 'Assuit' },
    'أسوان': { _id: 'kLvZ5JY6LJPL5chzN', name: 'Aswan' },
    'اسوان': { _id: 'kLvZ5JY6LJPL5chzN', name: 'Aswan' },
    'بني سويف': { _id: 'Lzbbvtzz7D2CgE2PL', name: 'Bani Suif' },
    'البحيرة': { _id: 'g3GchTSmCgR2JynsJ', name: 'Behira' },
    'البحيره': { _id: 'g3GchTSmCgR2JynsJ', name: 'Behira' },
    'القاهرة': { _id: 'FceDyHXwpSYYF9zGW', name: 'Cairo' },
    'القاهره': { _id: 'FceDyHXwpSYYF9zGW', name: 'Cairo' },
    'الدقهلية': { _id: 'RrDhS8YYsXAwZ9Zfo', name: 'Dakahlia' },
    'الدقهليه': { _id: 'RrDhS8YYsXAwZ9Zfo', name: 'Dakahlia' },
    'المنصورة': { _id: 'RrDhS8YYsXAwZ9Zfo', name: 'Dakahlia' }, // City in Dakahlia
    'المنصوره': { _id: 'RrDhS8YYsXAwZ9Zfo', name: 'Dakahlia' },
    'دمياط': { _id: 'qoZvYcZ8Cqji4pGp5', name: 'Damietta' },
    'القليوبية': { _id: 'yp3atroeTwnyiBNKE', name: 'El Kalioubia' },
    'القليوبيه': { _id: 'yp3atroeTwnyiBNKE', name: 'El Kalioubia' },
    'الفيوم': { _id: 'BW5MiNxEirB7tuz2y', name: 'Fayoum' },
    'الغربية': { _id: 'K3RwC677J8kJytdZD', name: 'Gharbia' },
    'الغربيه': { _id: 'K3RwC677J8kJytdZD', name: 'Gharbia' },
    'الجيزة': { _id: '0064Qb0OgcA', name: 'Giza' },
    'الجيزه': { _id: '0064Qb0OgcA', name: 'Giza' },
    'جيزة': { _id: '0064Qb0OgcA', name: 'Giza' },
    'الإسماعيلية': { _id: 'PJqNriLtFtx2cfkKP', name: 'Ismailia' },
    'الإسماعيليه': { _id: 'PJqNriLtFtx2cfkKP', name: 'Ismailia' },
    'الاسماعيلية': { _id: 'PJqNriLtFtx2cfkKP', name: 'Ismailia' },
    'كفر الشيخ': { _id: 'ByP7rFCjL6XzF6j4S', name: 'Kafr Alsheikh' },
    'الأقصر': { _id: 'wgYEdH2WMzxGE2Ztp', name: 'Luxor' },
    'الاقصر': { _id: 'wgYEdH2WMzxGE2Ztp', name: 'Luxor' },
    'مرسي مطروح': { _id: 'KBpGiRZJMIx', name: 'Matrouh' },
    'مطروح': { _id: 'KBpGiRZJMIx', name: 'Matrouh' },
    'المنيا': { _id: 'si6eLnKjXqTFTMBj9', name: 'Menya' },
    'المنوفية': { _id: 'ruBSjGBDX9wpRa3cc', name: 'Monufia' },
    'المنوفيه': { _id: 'ruBSjGBDX9wpRa3cc', name: 'Monufia' },
    'الوادي الجديد': { _id: 'w4yDVHVJWqa4HpbzA', name: 'New Valley' },
    'الساحل الشمالي': { _id: '2hGtNLfRgqGrJjnW9', name: 'North Coast' },
    'شمال سيناء': { _id: 'ZuCaDAVQlPT', name: 'North Sinai' },
    'بور سعيد': { _id: 'skFtf6ZmKo8kBEBDK', name: 'Port Said' },
    'قنا': { _id: 'vfTHTes3uGjAszgtg', name: 'Qena' },
    'البحر الأحمر': { _id: 'r5TscLCNSjR2GimxQ', name: 'Red Sea' },
    'البحر الاحمر': { _id: 'r5TscLCNSjR2GimxQ', name: 'Red Sea' },
    'الشرقية': { _id: '6ExcoGbpYHnggP8JD', name: 'Sharqia' },
    'الشرقيه': { _id: '6ExcoGbpYHnggP8JD', name: 'Sharqia' },
    'الزقازيق': { _id: '6ExcoGbpYHnggP8JD', name: 'Sharqia' }, // City in Sharqia
    'سوهاج': { _id: 'n3EENg2adhuR9xBZK', name: 'Sohag' },
    'جنوب سيناء': { _id: 'nG_c44vHQht', name: 'South Sinai' },
    'شرم الشيخ': { _id: 'nG_c44vHQht', name: 'South Sinai' },
    'السويس': { _id: 'PickurJ5uJZ9rDTHW', name: 'Suez' },
    // English names (fallback)
    'Cairo': { _id: 'FceDyHXwpSYYF9zGW', name: 'Cairo' },
    'Alexandria': { _id: 'Jrb6X6ucjiYgMP4T7', name: 'Alexandria' },
    'Giza': { _id: '0064Qb0OgcA', name: 'Giza' },
};

// Bosta Zone Map: Arabic city/area names -> { _id, name }
// Zone = المدينة/المنطقة داخل المحافظة (sub-city level)
const BOSTA_ZONES_MAP = {
    // Cairo zones
    'مدينة نصر': { _id: 'u15G2GQ0cMZ', name: 'Nasr City' },
    'مدينه نصر': { _id: 'u15G2GQ0cMZ', name: 'Nasr City' },
    'المعادي': { _id: 'aG5hnWoOlRq', name: 'Maadi' },
    'مصر الجديدة': { _id: 'Ri5iX3JiMCk', name: 'Heliopolis' },
    'مصر الجديده': { _id: 'Ri5iX3JiMCk', name: 'Heliopolis' },
    'شبرا': { _id: 'v5D3DMEQ0CU', name: 'Shubra' },
    'عين شمس': { _id: 'M9z2JzNRlBn', name: 'Ain Shams' },
    'التجمع': { _id: 'ZvJhK8_a-_s', name: 'New Cairo' },
    'التجمع الخامس': { _id: 'ZvJhK8_a-_s', name: 'New Cairo' },
    'القاهرة الجديدة': { _id: 'ZvJhK8_a-_s', name: 'New Cairo' },
    // Giza zones
    'الشيخ زايد': { _id: 'K7HCdF8M0nO', name: 'Sheikh Zayed' },
    '6 اكتوبر': { _id: 'YVIJmI56b5y', name: '6th Of October' },
    '6 أكتوبر': { _id: 'YVIJmI56b5y', name: '6th Of October' },
    'المهندسين': { _id: 'jDC0K4rC3jQ', name: 'Mohandessin' },
    'الدقي': { _id: 'BLjDW8_fFkD', name: 'Dokki' },
    'الهرم': { _id: 'j7t5AJ3Kpg9', name: 'Haram' },
    // Dakahlia zones
    'المنصورة': { _id: 'xricXU3FLaO', name: 'ElMansourah' },
    'المنصوره': { _id: 'xricXU3FLaO', name: 'ElMansourah' },
    'ميت غمر': { _id: 'u-m4fWScaJg', name: 'Mit Ghamr' },
    // Sharqia zones
    'الزقازيق': { _id: 'qj1cLDrTnYR', name: 'ElZakazik' },
    'العاشر من رمضان': { _id: 'fRHQPnOXFO9', name: '10th Of Ramadan' },
    '10 رمضان': { _id: 'fRHQPnOXFO9', name: '10th Of Ramadan' },
    // Gharbia zones
    'طنطا': { _id: 'jmLVGOoNIPl', name: 'Tanta' },
    'المحلة': { _id: 'M5JhwnHOTDI', name: 'Mahalla' },
    'المحله': { _id: 'M5JhwnHOTDI', name: 'Mahalla' },
    'المحلة الكبرى': { _id: 'M5JhwnHOTDI', name: 'Mahalla' },
    // Behira zones
    'دمنهور': { _id: 'bBhkU8LYZBN', name: 'Damanhour' },
    'كفر الدوار': { _id: 'DPlXWRQ5yCB', name: 'Kafr El Dawar' },
    // Monufia zones
    'شبين الكوم': { _id: 'l9N_Fzxvwvf', name: 'Shebin El Kom' },
    // Kalioubia zones
    'بنها': { _id: 'N1p7HNBaUmO', name: 'Banha' },
    'شبرا الخيمة': { _id: 'bCvAmQfEPbS', name: 'Shobra El Kheima' },
    'شبرا الخيمه': { _id: 'bCvAmQfEPbS', name: 'Shobra El Kheima' },
};

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

            // Resolve city to Bosta city object via map
            const cityTrimmed = city.trim();
            const bostaCity = BOSTA_CITIES_MAP[cityTrimmed] || { _id: 'FceDyHXwpSYYF9zGW', name: 'Cairo' };
            console.log(`[Bosta] Resolved city '${cityTrimmed}' -> ${bostaCity.name} (${bostaCity._id})`);

            // Extract zone (المنطقة = city within governorate)
            // The zone is typically the second-to-last part of a comma-separated address
            let bostaZone = null;
            try {
                let rawAddr = '';
                if (typeof shippingAddress === 'string') rawAddr = shippingAddress;
                else if (shippingAddress?.address) rawAddr = shippingAddress.address;
                const addrParts = rawAddr.split(',').map(s => s.trim()).filter(Boolean);
                if (addrParts.length >= 3) {
                    // Try the second-to-last part as zone (city within governorate)
                    const zoneName = addrParts[addrParts.length - 2];
                    bostaZone = BOSTA_ZONES_MAP[zoneName] || null;
                    if (bostaZone) console.log(`[Bosta] Resolved zone '${zoneName}' -> ${bostaZone.name}`);
                }
            } catch(e) { /* ignore */ }

            const customerName = orderData.users?.name || extractedName || 'عميل هوسي';
            const customerPhone = orderData.users?.phone || extractedPhone || '';
            
            // Extract Product Names and Variants for Description
            let productNames = [];
            if (orderData.order_items && orderData.order_items.length > 0) {
                productNames = orderData.order_items.map(item => {
                    const p = item.products;
                    const name = p && p.name ? p.name : (item.name || `Product ${item.product_id}`);
                    const details = [];
                    if (item.size) details.push(`Size: ${item.size}`);
                    if (item.color) details.push(`Color: ${item.color}`);
                    return details.length > 0 ? `${name} (${details.join(', ')})` : name;
                });
            }
            
            let description = productNames.length > 0 ? productNames.join(' + ') : `Hawsni Order #${orderData.order_number || orderData.id}`;
            // Limit to avoid Bosta validation error if characters exceed limit
            if (description.length > 1000) { // Bosta usually allows up to 1000, but let's be safe
                description = description.substring(0, 997) + '...';
            }

            const sizeOptions = options.size || 'MEDIUM';
            const packageTypeMap = {
                'SMALL': 'Small',
                'MEDIUM': 'Medium',
                'LARGE': 'Large'
            };

            // Calculate Product Value for Compensation (Price without shipping - 100)
            const subtotal = parseFloat(orderData.total || 0) - parseFloat(orderData.shipping_fee || 0);
            let declaredValue = Math.max(0, subtotal - 100);

            const payload = {
                type: 10, // Package Delivery
                specs: {
                    size: sizeOptions,
                    packageType: packageTypeMap[sizeOptions] || 'Medium',
                    packageDetails: {
                        itemsCount: orderData.order_items?.length || 1,
                        description: description
                    }
                },
                notes: orderData.notes || 'لا يوجد ملاحظات',
                cod: parseFloat(orderData.total), // Cash on Delivery amount
                declaredValue: declaredValue, // Insurance / Compensation Value
                dropOffAddress: {
                    city: bostaCity,
                    ...(bostaZone ? { zone: bostaZone } : {}),
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
