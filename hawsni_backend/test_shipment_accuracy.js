require('dotenv').config();
const bostaService = require('./services/bostaService');

async function testShipmentAccuracy() {
    console.log('--- Testing Bosta Shipment Accuracy ---');

    const dummyOrderData = {
        id: 'test-order-999',
        order_number: 'HW-TEST-001',
        total: 550,
        shipping_fee: 50,
        notes: 'برجاء الاتصال قبل الوصول - تجربة تقنية هوسي',
        shipping_address: {
            name: 'حسين إختبار',
            phone: '01016270395',
            state: 'اسوان',
            city: 'ابو سمبل',
            street: 'شارع النيل بجوار البنك',
            // Detailed fields from the new dropdowns/UI
            districtId: '3_kDqTPTlo5', // Official Bosta ID for Abu Simbel
            buildingNumber: '10',
            floor: '2',
            apartment: '5'
        },
        order_items: [
            { name: 'قميص هوسي ملكي', quantity: 1, size: 'XL', color: 'أسود' }
        ]
    };

    try {
        console.log('[Test] Initiating createShipment check...');
        // This will log the payload to the console in the bostaService.js
        const result = await bostaService.createShipment(dummyOrderData, { size: 'SMALL' });
        
        console.log('--- Test Execution Result ---');
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('--- Test Failed (Expected if API key is test or IP is restricted) ---');
        console.error(error.message);
    }
}

testShipmentAccuracy();
