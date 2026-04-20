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
            // Clean username: remove '@' if present
            const cleanUser = this.telegramUser.replace('@', '');
            const encodedText = encodeURIComponent(text);
            
            // USING THE EXACT STANDARDIZED VOICE NAME FOR ARABIC
            // ar-XA-Standard-A is the most reliable female voice for calls
            const url = `https://api.callmebot.com/start.php?user=${cleanUser}&text=${encodedText}&lang=ar-XA-Standard-A`;
            
            console.log(`[NotificationService] 📞 Triggering Telegram VOICE CALL to ${cleanUser}...`);
            const res = await fetch(url);
            
            if (res.ok) {
                console.log('[NotificationService] ✅ Call API Request accepted.');
                return true;
            } else {
                const errText = await res.text();
                console.error('[NotificationService] ❌ Call API Error:', errText);
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
