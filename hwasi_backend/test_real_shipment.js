require('dotenv').config();
const bostaService = require('./services/bostaService');

async function sendRealTestShipment() {
    console.log('--- Sending REAL Bosta Test Shipment (Cairo) ---');

    const realTestData = {
        id: 'real-test-' + Date.now(),
        order_number: 'HW-REAL-777',
        total: 100, // Small amount for testing
        shipping_fee: 50,
        notes: 'تجربة تقنية - يرجى عدم الاتصال بالعميل - اختبار هوسي',
        shipping_address: {
            name: 'حسين إختبار حقيقي',
            phone: '01016270395',
            state: 'القاهرة',
            city: 'مدينة نصر',
            street: 'شارع عباس العقاد - أمام كنتاكي',
            // Official IDs for Cairo/Nasr City
            cityId: 'FceDyHXwpSYYF9zGW',
            districtId: 'CKPWmy54eRVZZXiBuvFTa',
            buildingNumber: '1',
            floor: '1',
            apartment: '1'
        },
        order_items: [
            { name: 'قميص هوسي تجريبي', quantity: 1, size: 'L', color: 'أبيض' }
        ]
    };

    try {
        const result = await bostaService.createShipment(realTestData, { size: 'SMALL' });
        
        console.log('--- 🚀 SUCCESS! SHIPMENT CREATED ---');
        console.log(`Tracking Number: ${result.trackingNumber}`);
        console.log(`Bosta ID: ${result.bostaId}`);
    } catch (error) {
        console.error('--- ❌ ERROR ---');
        console.error(error.message);
        
        if (error.message.includes('4009')) {
             console.log('\n💡 نصيحة تقنية: هذا الخطأ يعني أن حسابك في بوسطة ينقصه "عنوان استلام" (Pickup Address).');
             console.log('يرجى الدخول على لوحة تحكم بوسطة وإضافة عنوان المحافظة التي تشحن منها أولاً.');
        }
    }
}

sendRealTestShipment();
