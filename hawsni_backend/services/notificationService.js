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
            // Ensure username starts with '@' as required by CallMeBot for calls
            let telegramId = this.telegramUser.trim();
            if (!telegramId.startsWith('@') && !telegramId.startsWith('+')) {
                telegramId = '@' + telegramId;
            }

            const encodedText = encodeURIComponent(text);

            // Using source=auth to ensure the voice engine is activated for authenticated users
            const url = `https://api.callmebot.com/start.php?user=${telegramId}&text=${encodedText}&lang=ar&source=auth`;

            console.log(`[NotificationService] 📞 Triggering Telegram VOICE CALL to ${telegramId}...`);
            const res = await fetch(url);
            const responseBody = await res.text();

            if (res.ok) {
                console.log(`[NotificationService] ✅ Call API Response: ${responseBody}`);
                return true;
            } else {
                console.error(`[NotificationService] ❌ Call API Error Status: ${res.status}, Body: ${responseBody}`);
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
