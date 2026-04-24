const aiChatbotService = require('./services/aiChatbotService');
require('dotenv').config();

async function run() {
    try {
        console.log("Testing text chat:");
        const res = await aiChatbotService.handleChat("عايز اعرف حاله الاوردر رقم 01550766916", []);
        console.log("Reply:", res.reply);
    } catch(e) {
        console.error("Crash:", e);
    }
}
run();
