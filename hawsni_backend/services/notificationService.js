const fetch = require('node-fetch');

/**
 * Notification Service
 * Handles Telegram voice calls and text messages via CallMeBot API.
 */
class NotificationService {
    constructor() {
        this.telegramUser = process.env.TELEGRAM_USER || '@he_s_en';
        this.lastCallTime = 0; // To prevent the 65s rate limit error
    }

    /**
     * Trigger a Telegram Voice Call
     * @param {string} text - The message to be read by the voice bot (Arabic supported)
     */
    async sendTelegramCall(text = 'اهلا بك يا حسين في متجر هوسي يوجد عميل يطلب المساعدة الان') {
        try {
            // Rate limit check: CallMeBot allows 1 call every 65 seconds
            const now = Date.now();
            if (now - this.lastCallTime < 70000) {
                console.log('[NotificationService] ⏳ Call skipped to respect 70s rate limit.');
                return false;
            }

            // Ensure username starts with '@' as required by CallMeBot
            let telegramId = this.telegramUser.trim();
            if (!telegramId.startsWith('@') && !telegramId.startsWith('+')) {
                telegramId = '@' + telegramId;
            }
            
            // Repeat the message to give the user time to hear it clearly
            // And remove any complex diacritics
            const cleanText = text.replace(/[^\u0621-\u064A\s]/g, '');
            const repeatedText = `${cleanText}. اكرر، ${cleanText}`;
            const encodedText = encodeURIComponent(repeatedText);
            
            // Using the successful combination found during testing
            const url = `https://api.callmebot.com/start.php?user=${telegramId}&text=${encodedText}&lang=ar-XA-Standard-C&source=auth&cc=no`;
            
            console.log(`[NotificationService] 📞 Triggering Telegram VOICE CALL to ${telegramId}...`);
            const res = await fetch(url);
            const responseBody = await res.text();
            
            if (res.ok && !responseBody.includes('ERROR')) {
                console.log(`[NotificationService] ✅ Call Success: ${responseBody}`);
                this.lastCallTime = Date.now();
                return true;
            } else {
                console.error(`[NotificationService] ❌ Call API Error: ${responseBody}`);
                return false;
            }
        } catch (error) {
            console.error('[NotificationService] ❌ Call Execution Error:', error);
            return false;
        }
    }

    /**
     * Send a Telegram Text Message
     * @param {string} text - The message content
     */
    async sendTelegramText(text) {
        try {
            const encodedText = encodeURIComponent(text);
            const url = `https://api.callmebot.com/text.php?user=${this.telegramUser}&text=${encodedText}`;

            console.log(`[NotificationService] 💬 Sending Telegram Text to ${this.telegramUser}...`);
            const res = await fetch(url);

            if (!res.ok) {
                const errorText = await res.text();
                console.error('[NotificationService] ❌ Text send failed:', errorText);
                return false;
            }

            console.log('[NotificationService] ✅ Text sent successfully.');
            return true;
        } catch (error) {
            console.error('[NotificationService] ❌ Unexpected error in sendTelegramText:', error.message);
            return false;
        }
    }
}

module.exports = new NotificationService();
