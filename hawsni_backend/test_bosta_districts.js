const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function run() {
    const res = await fetch("https://api.bosta.co/api/v2/cities/getAllDistricts");
    const json = await res.json();
    const alex = json.data.filter(d => (d.cityName || '').toLowerCase().includes('alexandria') || (d.cityOtherName || '').includes('الإسكندرية'));
    console.log(alex.map(a => `${a.districtName} - ${a.districtOtherName}`));
}
run();
