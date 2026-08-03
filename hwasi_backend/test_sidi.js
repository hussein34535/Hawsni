const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function run() {
    const res = await fetch("https://api.bosta.co/api/v2/cities/getAllDistricts");
    const json = await res.json();
    let found = false;
    json.data.forEach(city => {
        if (city.districts) {
            city.districts.forEach(d => {
                if ((d.districtName || '').toLowerCase().includes('gaber') || (d.districtOtherName || '').includes('جابر')) {
                    console.log("FOUND ZONE ID:", d.districtId, "in CITY ID:", city.cityId);
                    found = true;
                }
            });
        }
    });
    if (!found) console.log("Sidi Gaber NOT found in V2 registry!");
}
run();
