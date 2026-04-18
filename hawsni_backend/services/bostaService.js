const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const supabase = require('../config/supabase');
const aiService = require('./aiService');

let cachedDistricts = null;
const BOSTA_V2_URL = 'https://api.bosta.co/api/v2';

const BOSTA_API_KEY = process.env.BOSTA_API_KEY;
const BOSTA_BASE_URL = 'https://api.bosta.co/api/v0';

// Bosta City Map: Arabic/English names -> { _id, name }
// Source: GET /api/v0/cities + manual Arabic aliases from Hawsni addresses
const BOSTA_CITIES_MAP = {
    // Arabic governorate names
    'الاسكندرية': { _id: 'Jrb6X6ucjiYgMP4T7', name: 'Alexandria' },
    'الإسكندرية': { _id: 'Jrb6X6ucjiYgMP4T7', name: 'Alexandria' },
    'اسكندرية': { _id: 'Jrb6X6ucjiYgMP4T7', name: 'Alexandria' },
    'الاسكندريه': { _id: 'Jrb6X6ucjiYgMP4T7', name: 'Alexandria' },
    'الإسكندريه': { _id: 'Jrb6X6ucjiYgMP4T7', name: 'Alexandria' },
    'اسكندريه': { _id: 'Jrb6X6ucjiYgMP4T7', name: 'Alexandria' },
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
    // Alexandria zones
    'المنتزه': { _id: 'H7N6X6ucjiY', name: 'El Montaza' },
    'السيوف': { _id: 'Jrb6X6ucjiY', name: 'El Seyouf' },
    'سموحة': { _id: 'S7N6X6ucjiY', name: 'Smouha' },
    'سموحه': { _id: 'S7N6X6ucjiY', name: 'Smouha' },
    'سيدي بشر': { _id: 'B7N6X6ucjiY', name: 'Sidi Bishr' },
    'العجمي': { _id: 'A7N6X6ucjiY', name: 'El Agamy' },
    'محرم بك': { _id: 'M7N6X6ucjiY', name: 'Moharam Bek' },
    'لوران': { _id: 'L7N6X6ucjiY', name: 'Loran' },
};

class BostaService {
    /**
     * Fetch all districts from Bosta v2 API and cache them
     */
    async getBostaDistricts() {
        if (cachedDistricts) return cachedDistricts;
        try {
            console.log('[Bosta] Fetching latest districts from v2 API...');
            const response = await fetch(`${BOSTA_V2_URL}/cities/getAllDistricts`, {
                headers: { 'Authorization': BOSTA_API_KEY }
            });
            const result = await response.json();
            if (result.success && result.data) {
                cachedDistricts = result.data;
                console.log(`[Bosta] Successfully cached ${cachedDistricts.length} cities with districts.`);
                return cachedDistricts;
            }
        } catch (error) {
            console.error('[Bosta] Failed to fetch districts from v2:', error.message);
        }
        return null;
    }

    /**
     * Find the best matching Bosta ID for a given city and area name
     */
    async matchAddress(cityName, areaName) {
        const districts = await this.getBostaDistricts();
        if (!districts) return null;

        // 1. Match City
        const cityMatch = districts.find(c =>
            c.cityName?.toLowerCase() === cityName?.toLowerCase() ||
            c.cityOtherName === cityName ||
            c.cityOtherName?.includes(cityName) ||
            cityName?.includes(c.cityOtherName)
        );

        if (!cityMatch) return null;

        // 2. Match Zone/District within city
        let zoneMatch = null;
        if (areaName && cityMatch.districts) {
            // Exact or partial match
            zoneMatch = cityMatch.districts.find(d =>
                d.zoneName?.toLowerCase() === areaName?.toLowerCase() ||
                d.zoneOtherName === areaName ||
                d.districtName?.toLowerCase() === areaName?.toLowerCase() ||
                d.districtOtherName === areaName ||
                areaName?.includes(d.zoneOtherName) ||
                d.zoneOtherName?.includes(areaName)
            );
        }

        return {
            city: { _id: cityMatch.cityId, name: cityMatch.cityName },
            // districtId هو اللي بوسطة بتستخدمه كـ primary key للمنطقة
            zone: zoneMatch ? { _id: zoneMatch.districtId || zoneMatch.zoneId, name: zoneMatch.districtName || zoneMatch.zoneName } : null
        };
    }

    /**
     * Create a new shipment (Delivery) in Bosta
     * @param {Object} orderData The mapped order data from Hawsni
     */
    async createShipment(orderData, options = {}) {
        try {
            console.log(`[Bosta] Creating shipment for order ${orderData.order_number || orderData.id}...`);

            // Map Hawsni structure to Bosta expected structure
            let shippingAddress = orderData.shipping_address;

            let city = 'القاهرة'; // Default Governorate
            let area = null;       // Area/Zone
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
                    if (shippingAddress.state && shippingAddress.city) {
                        city = shippingAddress.state;   // Typically the Governorate
                        area = shippingAddress.city;    // Typically the Area/District
                        address = shippingAddress.street || shippingAddress.address || address;
                    }
                    else if (shippingAddress.state || shippingAddress.city) {
                        city = shippingAddress.state || shippingAddress.city;
                        address = shippingAddress.street || shippingAddress.address || address;
                    }
                    // Or does it just have a concatenated 'address' string?
                    else if (shippingAddress.address && typeof shippingAddress.address === 'string') {
                        let parts = shippingAddress.address.split(',').map(s => s.trim());
                        if (parts.length >= 2) {
                            city = parts[parts.length - 1]; // Governorate is usually last
                            area = parts[parts.length - 2]; // Area is usually before governorate
                            address = parts.slice(0, parts.length - 2).join(' - ') || parts.slice(0, parts.length - 1).join(' - ');
                        } else {
                            address = shippingAddress.address;
                        }
                    }
                } else if (typeof shippingAddress === 'string') {
                    // Legacy naked string format
                    let parts = shippingAddress.split(',').map(s => s.trim());
                    if (parts.length >= 2) {
                        city = parts[parts.length - 1];
                        area = parts[parts.length - 2];
                        address = parts.slice(0, parts.length - 2).join(' - ') || parts.slice(0, parts.length - 1).join(' - ');
                    } else {
                        address = shippingAddress;
                    }
                }
            }

            // --- AI Parsing & Dynamic Matching Logic ---
            let bostaCity = { _id: 'FceDyHXwpSYYF9zGW', name: 'Cairo' }; // Default
            let bostaZone = null;

            try {
                // Combine what we have for AI to confirm or refine
                const fullAddressString = `${address}, ${area ? area + ', ' : ''}${city}`;
                const aiResult = await aiService.parseAddress(fullAddressString);

                // Use extracted area if AI didn't find one better
                const finalCityName = aiResult?.city || city;
                const finalAreaName = aiResult?.zone || area;

                if (finalCityName) {
                    console.log(`[Bosta-AI] Matching: City=${finalCityName}, Zone=${finalAreaName || 'None'}`);
                    const match = await this.matchAddress(finalCityName, finalAreaName);
                    if (match) {
                        bostaCity = match.city;
                        bostaZone = match.zone;
                        console.log(`[Bosta-AI] Match Success: ${bostaCity.name} -> ${bostaZone?.name || 'No Zone'}`);
                    }
                }
            } catch (aiError) {
                console.error('[Bosta-AI] Parsing/Matching failed:', aiError.message);
            }

            // Fallback for bostaCity if not found or still Cairo while input was something else
            if (bostaCity._id === 'FceDyHXwpSYYF9zGW' && city && !city.includes('القاهرة')) {
                const manualCity = BOSTA_CITIES_MAP[city.trim()];
                if (manualCity) bostaCity = manualCity;
            }

            // Fallback for bostaZone if not found
            if (!bostaZone && area) {
                const manualZone = BOSTA_ZONES_MAP[area.trim()];
                if (manualZone) bostaZone = manualZone;
            }

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
                    if (item.color) {
                        // Strip hex codes (e.g., #ffffff or #fff) from color name
                        const cleanColor = item.color.replace(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g, '').trim();
                        if (cleanColor) {
                            details.push(`Color: ${cleanColor}`);
                        }
                    }
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

            // بناء الـ Payload طبقات للهيكل اللى بوسطة بتطلبه (v0 API)
            const payload = {
                type: 10, // Package Delivery
                specs: {
                    size: sizeOptions,
                    packageDetails: {
                        itemsCount: orderData.order_items?.length || 1,
                        description: description
                    }
                },
                cod: parseFloat(orderData.total || 0), // Cash on Delivery amount
                businessReference: String(orderData.order_number || orderData.id),
                allowToOpenPackage: options.allowToOpenPackage !== undefined ? options.allowToOpenPackage : true,
                notes: orderData.notes || 'لا يوجد ملاحظات',
                receiver: {
                    firstName: customerName.split(' ')[0] || 'Customer',
                    lastName: customerName.split(' ').slice(1).join(' ') || 'Hawsni',
                    phone: customerPhone.replace(/\s+/g, '').replace(/^\+20/, '0'),
                },
                // بوسطة v2 API: city=String, cityId=ID المحافظة, districtId=ID المنطقة
                // المحافظة بتظهر في الداشبورد بناءً على districtId مش city string
                dropOffAddress: {
                    city: bostaCity.name,                  // string — اسم المحافظة
                    cityId: bostaCity._id,                 // ID المحافظة (مطلوب مع districtName)
                    ...(bostaZone
                        ? { districtId: bostaZone._id }    // ✅ الحقل الأساسي اللي بيحدد المنطقة والمحافظة
                        : { districtName: area || bostaCity.name, } // fallback لو مفيش districtId
                    ),
                    firstLine: address.length > 5 ? address : `${address} - ${bostaCity.name}`, // لازم > 5 حروف
                }
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
