const aiChatbotService = require('../../services/aiChatbotService');

class ChatController {
    /**
     * POST /api/chat
     * Request body: { message: "string", history: [] }
     */
    async sendMessage(req, res) {
        try {
            const { message, history } = req.body;

            if (!message) {
                return res.status(400).json({ success: false, error: 'الرسالة مطلوبة' });
            }

            // Call the AI Service
            const aiResponse = await aiChatbotService.handleChat(message, history || []);

            return res.status(200).json({
                success: true,
                reply: aiResponse.reply,
                history: aiResponse.history
            });

        } catch (error) {
            console.error('[ChatController] Error:', error);
            return res.status(500).json({ success: false, error: 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً' });
        }
    }
}

module.exports = new ChatController();
