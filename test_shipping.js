async function test() {
    try {
        console.log("Fetching cities...");
        const res = await fetch('https://hwasibackend.vercel.app/api/shipping/cities');
        const data = await res.json();
        console.log(`Found ${data.cities?.length} cities. First 3:`, data.cities?.slice(0, 3));
        
        if (data.cities?.length > 0) {
            const cityId = data.cities[0]._id;
            console.log(`\nFetching districts for city ${cityId}...`);
            const res2 = await fetch(`https://hwasibackend.vercel.app/api/shipping/districts/${cityId}`);
            const data2 = await res2.json();
            console.log(`Found ${data2.districts?.length} districts. First 3:`, data2.districts?.slice(0, 3));
        }
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
