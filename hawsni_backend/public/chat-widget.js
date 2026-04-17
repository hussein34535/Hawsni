/**
 * Hawsni AI Chat Widget
 * Embed this script on your frontend website to add the AI Chatbot.
 * <script src="https://hwasibackend.vercel.app/chat-widget.js" defer></script>
 */

(function() {
    // Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
        .hawsni-chat-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999999;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            direction: rtl;
        }
        .hawsni-chat-btn {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #0E4435;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            cursor: pointer;
            border: none;
            transition: transform 0.2s;
        }
        .hawsni-chat-btn:hover {
            transform: scale(1.05);
        }
        .hawsni-chat-btn svg {
            fill: white;
            width: 30px;
            height: 30px;
        }
        .hawsni-chat-window {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 350px;
            height: 500px;
            max-height: 80vh;
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            display: none;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            transition: all 0.3s ease;
        }
        .hawsni-chat-window.open {
            display: flex;
            animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .hawsni-chat-header {
            background: #0E4435;
            color: white;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .hawsni-chat-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }
        .hawsni-close-btn {
            background: transparent;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 18px;
        }
        .hawsni-chat-body {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background: #f8fafc;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .hawsni-msg {
            max-width: 85%;
            padding: 10px 14px;
            border-radius: 12px;
            font-size: 14px;
            line-height: 1.5;
            word-wrap: break-word;
        }
        .hawsni-msg-bot {
            background: #fff;
            color: #1e293b;
            align-self: flex-start;
            border-bottom-right-radius: 4px;
            border: 1px solid #e2e8f0;
        }
        .hawsni-msg-user {
            background: #0E4435;
            color: white;
            align-self: flex-end;
            border-bottom-left-radius: 4px;
        }
        .hawsni-chat-footer {
            padding: 12px;
            background: white;
            border-top: 1px solid #e2e8f0;
            display: flex;
            gap: 8px;
        }
        .hawsni-chat-input {
            flex: 1;
            padding: 10px 12px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            outline: none;
            font-family: inherit;
        }
        .hawsni-chat-input:focus {
            border-color: #0E4435;
        }
        .hawsni-send-btn {
            background: #0E4435;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 0 16px;
            cursor: pointer;
            font-weight: bold;
        }
        .hawsni-typing {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
            display: none;
            align-self: flex-start;
        }
        /* Mobile handling */
        @media (max-width: 480px) {
            .hawsni-chat-window {
                width: 100vw;
                height: 100vh;
                max-height: 100vh;
                position: fixed;
                bottom: 0;
                right: 0;
                border-radius: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Inject HTML
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'hawsni-chat-widget';
    widgetContainer.innerHTML = `
        <div class="hawsni-chat-window" id="hawsniChatWindow">
            <div class="hawsni-chat-header">
                <h3>✨ مساعد Hawsni</h3>
                <button class="hawsni-close-btn" id="hawsniCloseBtn">&times;</button>
            </div>
            <div class="hawsni-chat-body" id="hawsniChatBody">
                <div class="hawsni-msg hawsni-msg-bot">مرحباً بك في متجر Hawsni للفخامة والأزياء. كيف يمكنني مساعدتك اليوم أو تتبع طلبك؟</div>
            </div>
            <div class="hawsni-typing" id="hawsniTyping">المساعد يكتب...</div>
            <div class="hawsni-chat-footer">
                <input type="text" class="hawsni-chat-input" id="hawsniChatInput" placeholder="اكتب رسالتك وتتبع طلبك...">
                <button class="hawsni-send-btn" id="hawsniSendBtn">إرسال</button>
            </div>
        </div>
        <button class="hawsni-chat-btn" id="hawsniChatBtn">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
        </button>
    `;
    document.body.appendChild(widgetContainer);

    // Logic
    const chatBtn = document.getElementById('hawsniChatBtn');
    const closeBtn = document.getElementById('hawsniCloseBtn');
    const chatWindow = document.getElementById('hawsniChatWindow');
    const sendBtn = document.getElementById('hawsniSendBtn');
    const input = document.getElementById('hawsniChatInput');
    const chatBody = document.getElementById('hawsniChatBody');
    const typingLabel = document.getElementById('hawsniTyping');

    let chatHistory = [];
    const API_URL = 'https://hwasibackend.vercel.app/api/chat'; // Link to deployed backend

    chatBtn.addEventListener('click', () => {
        chatWindow.classList.add('open');
        chatBtn.style.display = 'none';
        input.focus();
    });

    closeBtn.addEventListener('click', () => {
        chatWindow.classList.remove('open');
        chatBtn.style.display = 'flex';
    });

    function appendMessage(sender, text) {
        const div = document.createElement('div');
        div.className = 'hawsni-msg ' + (sender === 'user' ? 'hawsni-msg-user' : 'hawsni-msg-bot');
        const formatted = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
        div.innerHTML = formatted;
        chatBody.appendChild(div);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        appendMessage('user', text);
        input.value = '';
        input.disabled = true;
        sendBtn.disabled = true;
        
        chatBody.appendChild(typingLabel); // Move to bottom
        typingLabel.style.display = 'block';
        chatBody.scrollTop = chatBody.scrollHeight;

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: chatHistory })
            });
            const data = await res.json();
            
            if (data.success) {
                appendMessage('bot', data.reply);
                chatHistory = data.history;
            } else {
                appendMessage('bot', 'عذراً، حدث خطأ: ' + (data.error || 'غير معروف'));
            }
        } catch (e) {
            appendMessage('bot', 'لا يمكن الاتصال بالخادم الآن. يرجى المحاولة لاحقاً.');
        } finally {
            input.disabled = false;
            sendBtn.disabled = false;
            typingLabel.style.display = 'none';
            input.focus();
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

})();
