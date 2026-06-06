const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const supabase = require('../config/supabase');
const aiService = require('./aiService');

let cachedDistricts = null;
const BOSTA_V2_URL = 'https://api.bosta.co/api/v2';

const BOSTA_API_KEY = process.env.BOSTA_API_KEY;
const BOSTA_BASE_URL = 'https://api.bosta.co/api/v0';

// Bosta Status Mapping: ID -> Arabic Status Text
const BOSTA_STATUS_MAP = {
    10: 'تم استلام طلب الشحن (بانتظار المندوب)',
    21: 'تم استلام الشحنة من المتجر',
    30: 'الشحنة في الطريق للمستودع',
    41: 'في الطريق للمستودع الرئيسي',
    42: 'الشحنة وصلت المستودع',
    43: 'الشحنة في الطريق للتوصيل لمحافظتك',
    44: 'الشحنة في عهدة مندوب التوصيل الآن',
    45: 'تم التسليم بنجاح ✅',
    46: 'قيد المرتجع (جارٍ الإرجاع للمحل)',
    47: 'مشكلة في التوصيل (يرجى مراجعة الموقع)',
    48: 'في انتظار رد من العميل',
    49: 'تم إلغاء الشحنة ❌',
    50: 'تم الإرجاع للمحل بنجاح'
};

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
                headers: { 'Authorization': `Bearer ${BOSTA_API_KEY}` }
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
     * Get a clean list of all Governorates (Cities) for dropdowns
     */
    async getFormattedCities() {
        const data = await this.getBostaDistricts();
        if (!data) return [];
        return data.map(city => ({
            id: city.cityId || city._id,
            name: city.cityName,
            arabicName: city.cityOtherName || city.cityName
        })).sort((a, b) => a.arabicName.localeCompare(b.arabicName, 'ar'));
    }

    /**
     * Get districts for a specific city ID
     */
    async getDistrictsByCity(cityId) {
        const data = await this.getBostaDistricts();
        if (!data) return [];
        const city = data.find(c => (c.cityId || c._id) === cityId);
        if (!city || !city.districts) return [];
        
        return city.districts.map(d => ({
            id: d.districtId || d.zoneId || d._id,
            name: d.districtName || d.zoneName,
            arabicName: d.districtOtherName || d.zoneOtherName || d.districtName
        })).sort((a, b) => a.arabicName.localeCompare(b.arabicName, 'ar'));
    }

    /**
     * Get real-time status and lifecycle of a delivery
     */
    async getDeliveryDetails(trackingNumber) {
        try {
            console.log(`[Bosta] Fetching details for Tracking # ${trackingNumber}...`);
            const response = await fetch(`${BOSTA_V2_URL}/deliveries/business/${trackingNumber}`, {
                headers: { 'Authorization': `Bearer ${BOSTA_API_KEY}` }
            });
            const result = await response.json();
            
            if (response.ok && result) {
                // Add human readable status
                const statusCode = result.state?.code || result.status;
                result.arabicStatus = BOSTA_STATUS_MAP[statusCode] || 'حالة غير معروفة';
                return result;
            }
            return null;
        } catch (error) {
            console.error('[Bosta] Error tracking delivery:', error.message);
            return null;
        }
    }

    /**
     * Find the best matching Bosta ID for a given city and area name
     */
    async matchAddress(cityName, areaName) {
        const districts = await this.getBostaDistricts();
        if (!districts) return null;

        const normalizeArabic = (str) => {
            if (!str) return '';
            return str.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim();
        };

        const safeCity = normalizeArabic(cityName);
        const safeArea = normalizeArabic(areaName);

        // 1. Match City (Governorate)
        let cityMatch = districts.find(c =>
            c.cityName?.toLowerCase() === cityName?.toLowerCase() ||
            normalizeArabic(c.cityOtherName) === safeCity ||
            normalizeArabic(c.cityOtherName).includes(safeCity) ||
            safeCity.includes(normalizeArabic(c.cityOtherName))
        );

        // 2. Deep Search fallback: if no city match, try to find the area in ANY city
        if (!cityMatch && safeArea) {
            console.log(`[Bosta-Match] City '${cityName}' not found. Deep searching area '${areaName}' across all cities...`);
            for (const c of districts) {
                const foundInDistricts = (c.districts || []).find(d => 
                    normalizeArabic(d.districtOtherName) === safeArea ||
                    normalizeArabic(d.zoneOtherName) === safeArea ||
                    normalizeArabic(d.districtOtherName).includes(safeArea) ||
                    safeArea.includes(normalizeArabic(d.districtOtherName))
                );
                if (foundInDistricts) {
                    cityMatch = c;
                    console.log(`[Bosta-Match] Deep Match Found! Area '${areaName}' belongs to city: ${c.cityName}`);
                    break;
                }
            }
        }

        if (!cityMatch) return null;

        // 3. Match Zone/District within the (found) city
        let zoneMatch = null;
        if (safeArea && cityMatch.districts) {
            zoneMatch = cityMatch.districts.find(d =>
                d.zoneName?.toLowerCase() === areaName?.toLowerCase() ||
                normalizeArabic(d.zoneOtherName) === safeArea ||
                d.districtName?.toLowerCase() === areaName?.toLowerCase() ||
                normalizeArabic(d.districtOtherName) === safeArea ||
                safeArea.includes(normalizeArabic(d.zoneOtherName)) ||
                normalizeArabic(d.zoneOtherName).includes(safeArea) ||
                safeArea.includes(normalizeArabic(d.districtOtherName)) ||
                normalizeArabic(d.districtOtherName).includes(safeArea)
            );
        }

        return {
            city: { _id: cityMatch.cityId || cityMatch._id, name: cityMatch.cityName },
            zone: zoneMatch ? { _id: zoneMatch.districtId || zoneMatch.zoneId || zoneMatch._id, name: zoneMatch.districtName || zoneMatch.zoneName } : null
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
            let zoneFromStaticMap = false;

            try {
                // ⭐ PRIORITY 1: Check for explicit Bosta IDs from Cascaded Dropdowns
                if (shippingAddress.districtId) {
                    const districtsData = await this.getBostaDistricts();
                    if (districtsData) {
                        for (const c of districtsData) {
                            const d = (c.districts || []).find(dist => (dist.districtId || dist.zoneId || dist._id) === shippingAddress.districtId);
                            if (d) {
                                bostaCity = { _id: c.cityId || c._id, name: c.cityName };
                                bostaZone = { _id: d.districtId || d.zoneId || d._id, name: d.districtName || d.zoneName };
                                console.log(`[Bosta] Precise ID Match: ${bostaCity.name} -> ${bostaZone.name}`);
                                break;
                            }
                        }
                    }
                }

                // ⭐ PRIORITY 2: If no explicit IDs, use AI to parse and match
                if (!bostaZone) {
                    // نجيب القائمة الحقيقية من بوسطة أولاً
                    const districts = await this.getBostaDistricts();

                    // نمرر القائمة للـ AI عشان يختار منها مباشرة
                    const fullAddressString = `${address}, ${area ? area + ', ' : ''}${city}`;
                    const aiResult = await aiService.parseAddress(fullAddressString, districts);

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
                }
            } catch (aiError) {
                console.error('[Bosta-AI] Parsing/Matching failed:', aiError.message);
            }

            // Fallback for bostaCity if not found or still Cairo while input was something else
            if (bostaCity._id === 'FceDyHXwpSYYF9zGW' && city && !city.includes('القاهرة')) {
                const manualCity = BOSTA_CITIES_MAP[city.trim()];
                if (manualCity) bostaCity = manualCity;
            }

            // Fallback for bostaZone — Static Map
            if (!bostaZone && area) {
                const manualZone = BOSTA_ZONES_MAP[area.trim()];
                if (manualZone) {
                    bostaZone = manualZone;
                    zoneFromStaticMap = true;
                }
            }

            // ⭐ Last Resort: لو لسه محددناش منطقة والمدينة لسه القاهرة (الديفولت)
            // ندي الـ AI العنوان الخام كاملاً ويبحث فيه من تلقاء نفسه
            if (!bostaZone) {
                try {
                    const districts = cachedDistricts || await this.getBostaDistricts();
                    // بنبعت العنوان الخام من قاعدة البيانات (مش المُعالج) عشان الـ AI يشوف كل تفاصيل المكان
                    const rawAddress = typeof orderData.shipping_address === 'string'
                        ? orderData.shipping_address
                        : JSON.stringify(orderData.shipping_address);

                    console.log('[Bosta-AI] Last resort: deep searching raw address...');
                    const deepResult = await aiService.parseAddress(rawAddress, districts);

                    if (deepResult?.city) {
                        const deepMatch = await this.matchAddress(deepResult.city, deepResult.zone);
                        if (deepMatch) {
                            bostaCity = deepMatch.city;
                            bostaZone = deepMatch.zone;
                            zoneFromStaticMap = false;
                            console.log(`[Bosta-AI] Deep Search Match: ${bostaCity.name} -> ${bostaZone?.name || 'No Zone'}`);
                        }
                    }
                } catch (deepErr) {
                    console.error('[Bosta-AI] Deep search failed:', deepErr.message);
                }
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
                'SMALL': 'SMALL',
                'MEDIUM': 'MEDIUM',
                'LARGE': 'LARGE'
            };
            const mappedSize = packageTypeMap[sizeOptions.toUpperCase()] || 'MEDIUM';

            // Calculate Product Value for Compensation (Price without shipping - 100)
            const subtotal = parseFloat(orderData.total || 0) - parseFloat(orderData.shipping_fee || 0);
            let declaredValue = Math.max(0, subtotal - 100);

            // Generate webhook URL for Bosta status updates
            const bostaWebhookUrl = process.env.BOSTA_WEBHOOK_URL;
            const webhookSecret = process.env.BOSTA_WEBHOOK_SECRET;

            // بناء الـ Payload طبقات للهيكل اللى بوسطة بتطلبه (v0 API)
            const payload = {
                type: 10, // Package Delivery
                specs: {
                    packageType: 'Parcel',
                    size: mappedSize,
                    packageSize: mappedSize === 'LARGE' ? 'Large' : (mappedSize === 'SMALL' ? 'Small' : 'Medium'),
                    packageDetails: {
                        itemsCount: orderData.order_items?.length || 1,
                        description: description,
                        weight: mappedSize === 'MEDIUM' ? 3 : (mappedSize === 'LARGE' ? 5 : 1)
                    }
                },
                cod: parseFloat(orderData.total || 0), // Cash on Delivery amount
                businessReference: String(orderData.order_number || orderData.id),
                allowToOpenPackage: options.allowToOpenPackage !== undefined ? options.allowToOpenPackage : true,
                ...(bostaWebhookUrl ? { webhookUrl: bostaWebhookUrl } : {}),
                ...(bostaWebhookUrl && webhookSecret ? { webhookCustomHeaders: { Authorization: webhookSecret } } : {}),
                notes: orderData.notes || 'لا يوجد ملاحظات',
                receiver: {
                    firstName: customerName.split(' ')[0] || 'Customer',
                    lastName: customerName.split(' ').slice(1).join(' ') || 'Hawsni',
                    phone: customerPhone.replace(/\s+/g, '').replace(/^(?:\+20|0020|20)(1[0125])/, '0$1'),
                    // Add secondary phone if available
                    ...(shippingAddress.alternative_phone || shippingAddress.guestAlternativePhone ? {
                        secondPhone: (shippingAddress.alternative_phone || shippingAddress.guestAlternativePhone).replace(/\s+/g, '').replace(/^(?:\+20|0020|20)(1[0125])/, '0$1')
                    } : {})
                },
                // V2 API (Modern): Requires districtId instead of string matching
                dropOffAddress: {
                    city: { _id: bostaCity._id || bostaCity.cityId, name: bostaCity.name },
                    cityId: bostaCity._id || bostaCity.cityId,
                    // Priority: Explicit districtId from input > matched bostaZone
                    ...(shippingAddress.districtId || (bostaZone && (bostaZone.districtId || bostaZone._id)) ? {
                        districtId: shippingAddress.districtId || bostaZone.districtId || bostaZone._id
                    } : {}),
                    firstLine: `${address}`.trim(),
                    // Detailed address fields for Bosta internal mapping
                    ...(shippingAddress.buildingNumber ? { buildingNumber: String(shippingAddress.buildingNumber) } : {}),
                    ...(shippingAddress.floor ? { floor: String(shippingAddress.floor) } : {}),
                    ...(shippingAddress.apartment ? { apartment: String(shippingAddress.apartment) } : {}),
                }
            };

            console.log('[Bosta] Sending payload to V2:', JSON.stringify(payload, null, 2));

            const response = await fetch(`${BOSTA_V2_URL}/deliveries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${BOSTA_API_KEY}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            console.log('[Bosta] API Response Status:', response.status);
            console.log('[Bosta] Full Response Data:', JSON.stringify(data, null, 2));

            if (!response.ok) {
                console.error('[Bosta] Error response:', data);
                throw new Error(data.message || 'Failed to create Bosta shipment');
            }

            // Extract tracking info (Bosta v2 might return it top-level or inside a data object)
            const trackingNumber = data.trackingNumber || (data.data && data.data.trackingNumber);
            const bostaId = data._id || data.id || (data.data && (data.data._id || data.data.id));

            console.log(`[Bosta] Successfully created shipment: Tracking # ${trackingNumber}`);

            // Save tracking number and bosta_id in our database
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    tracking_number: trackingNumber,
                    bosta_id: bostaId,
                    package_size: mappedSize // Save the size we sent to Bosta
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
                    'Authorization': `Bearer ${BOSTA_API_KEY}`
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

    /**
     * Get live shipment tracking status from Bosta API
     * Returns structured tracking data in Arabic for internal display
     */
    async getShipmentStatus(trackingNumber) {
        try {
            // Using the public tracking API which is more reliable for live updates
            const response = await fetch(`https://tracking.bosta.co/shipments/track/${trackingNumber}?lang=ar`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('[Bosta] Track error:', data);
                return null;
            }

            // Public API uses CurrentStatus and TransitEvents
            const currentStatus = data.CurrentStatus || {};
            const stateCode = currentStatus.code;
            const stateValue = currentStatus.state || '';
            const arabicStatus = BOSTA_STATUS_MAP[stateCode] || stateValue;

            // Build timeline from transit events
            const timeline = (data.TransitEvents || []).map(event => ({
                code: event.code,
                status: BOSTA_STATUS_MAP[event.code] || event.state || '',
                timestamp: event.timestamp,
                hub: event.hub || ''
            })).reverse(); // Latest first

            return {
                trackingNumber,
                stateCode,
                status: arabicStatus,
                isDelivered: stateCode === 45,
                isCancelled: stateCode === 49,
                timeline,
                estimatedDelivery: data.PromisedDate || null,
                provider: data.provider || 'بوسطة',
                // Note: Public API doesn't return full receiver details for privacy
                receiverName: null,
                address: null,
                city: null,
            };
        } catch (error) {
            console.error('[Bosta] Error tracking shipment:', error);
            return null;
        }
    }
}

module.exports = new BostaService();
