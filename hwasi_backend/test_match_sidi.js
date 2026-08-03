import bostaService from './services/bostaService.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    const city = "الإسكندرية";
    const area = "سيدي جابر ";
    
    console.log("Matching:", city, area);
    const match = await bostaService.matchAddress(city, area);
    console.log("Result:", match);
}
run();
