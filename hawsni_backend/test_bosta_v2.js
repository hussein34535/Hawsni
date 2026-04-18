const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function run() {
    const BOSTA_API_KEY = "42752dd8a5310bd00fab6eb9908fc6c804088073b585b48b5d24f2edec216800";
    
    // We are testing EXACTLY the payload that bostaService.js submitted in the latest commit b15adc0
    const payload = {
        type: 10,
        specs: {
            size: "SMALL",
            packageDetails: {
                itemsCount: 1,
                description: "Test Package"
            }
        },
        cod: 100,
        businessReference: "test_dev_10",
        allowToOpenPackage: true,
        notes: "Test",
        receiver: {
            firstName: "Moomen",
            lastName: "Shahin",
            phone: "01000000000"
        },
        dropOffAddress: {
            city: { _id: "Jrb6X6ucjiYgMP4T7", name: "Alexandria" },
            cityId: "Jrb6X6ucjiYgMP4T7",
            districtId: "TIOHAQrPWD", // Sidi Gaber Exact ID!
            firstLine: "جابر مبارك - عمارة - Sidi Gaber - Alexandria"
        }
    };

    console.log("Sending payload to V2...");
    const res = await fetch("https://api.bosta.co/api/v2/deliveries", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": BOSTA_API_KEY
        },
        body: JSON.stringify(payload)
    });
    
    const json = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(json, null, 2));
}
run();
