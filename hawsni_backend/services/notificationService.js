const fetch = require('node-fetch');

/**
 * Notification Service
 * Handles Telegram voice calls and text messages via CallMeBot API.
 */
class NotificationService {
    constructor() {
        this.telegramUser = process.env.TELEGRAM_USER || '@he_s_en';
    }

    /**
     * Trigger a Telegram Voice Call
     * @param {string} text - The message to be read by the voice bot (Arabic supported)
     */
    async sendTelegramCall(text = 'هناك عميل ينتظر المساعدة في متجر هَوَسي') {
        try {
            const encodedText = encodeURIComponent(text);
            // ar-XA-Standard-B is a high-quality Arabic Standard voice supported by CallMeBot
            const url = `https://api.callmebot.com/start.php?user=${this.telegramUser}&text=${encodedText}&lang=ar-XA-Standard-B&cc=no`;
            
            console.log(`[NotificationService] 📞 Triggering Telegram Call to ${this.telegramUser}...`);
            const res = await fetch(url);
            
            if (!res.ok) {
                const errorText = await res.text();
                console.error('[NotificationService] ❌ Call failed:', errorText);
                return false;
            }

            console.log('[NotificationService] ✅ Call triggered successfully.');
            return true;
        } catch (error) {
            console.error('[NotificationService] ❌ Unexpected error in sendTelegramCall:', error.message);
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
