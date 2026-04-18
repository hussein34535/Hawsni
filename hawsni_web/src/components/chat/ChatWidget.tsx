'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hwasibackend.vercel.app';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: 'أهلاً بيك في Hawsni ✨\nإزاي أقدر أساعدك النهاردة؟ ممكن أساعدك تدور على منتج أو تتبع طلبك.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ role: string; parts: Array<{ text: string }> }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // بناء الرابط بذكاء لمنع تكرار /api لو موجودة بالفعل في المتغير البيئي
      const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
      const res = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history })
      });
      const data = await res.json();

      if (data.success) {
        setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
        
        // تنظيف التاريخ من أي أجزاء تفكير (thoughts) قبل حفظه في الـ State
        const cleanHistory = (data.history || []).map((entry: any) => ({
          ...entry,
          parts: entry.parts.filter((p: any) => !p.thought)
        }));
        setHistory(cleanHistory);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: 'عذراً، حدث خطأ. حاول تاني.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { sender: 'bot', text: 'مش قادر أتواصل مع السيرفر دلوقتي. حاول بعد شوية.' }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, isLoading, history]);

  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      <style jsx global>{`
        .hwsni-chat-overlay {
          position: fixed;
          inset: 0;
          z-index: 100000;
          display: flex;
          flex-direction: column;
          background: #fff;
        }
        @media (min-width: 640px) {
          .hwsni-chat-overlay {
            inset: auto 16px 90px auto;
            width: 380px;
            height: 540px;
            border-radius: 20px;
            box-shadow: 0 12px 48px rgba(0,0,0,0.18);
            border: 1px solid #e2e8f0;
          }
        }
        .hwsni-chat-overlay.entering {
          animation: hwsniChatIn 0.25s ease-out forwards;
        }
        .hwsni-chat-overlay.exiting {
          animation: hwsniChatOut 0.2s ease-in forwards;
        }
        @keyframes hwsniChatIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes hwsniChatOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(16px) scale(0.97); }
        }
        .hwsni-fab {
          position: fixed;
          bottom: 80px;
          right: 16px;
          z-index: 99999;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #0E4435;
          color: #fff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(14,68,53,0.35);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .hwsni-fab:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 24px rgba(14,68,53,0.45);
        }
        .hwsni-fab:active {
          transform: scale(0.95);
        }
        @media (min-width: 640px) {
          .hwsni-fab { bottom: 24px; right: 24px; width: 60px; height: 60px; }
        }
        .hwsni-msg-row {
          display: flex;
          margin-bottom: 8px;
        }
        .hwsni-msg-row.user { justify-content: flex-end; }
        .hwsni-msg-row.bot { justify-content: flex-start; }
        .hwsni-bubble {
          max-width: 82%;
          padding: 10px 14px;
          font-size: 13.5px;
          line-height: 1.65;
          word-break: break-word;
          direction: rtl;
        }
        .hwsni-bubble.user {
          background: #0E4435;
          color: #fff;
          border-radius: 14px 14px 6px 14px;
        }
        .hwsni-bubble.bot {
          background: #f1f5f9;
          color: #1e293b;
          border-radius: 14px 14px 14px 6px;
        }
        .hwsni-typing {
          display: inline-flex;
          gap: 4px;
          padding: 10px 16px;
          background: #f1f5f9;
          border-radius: 14px 14px 14px 6px;
        }
        .hwsni-typing span {
          width: 7px; height: 7px;
          background: #94a3b8;
          border-radius: 50%;
          animation: hwsniBounce 1.2s infinite;
        }
        .hwsni-typing span:nth-child(2) { animation-delay: 0.15s; }
        .hwsni-typing span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes hwsniBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>

      {/* Chat Window */}
      {isOpen && (
        <div className="hwsni-chat-overlay entering">
          {/* Header */}
          <div style={{
            background: '#0E4435',
            color: '#fff',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            borderRadius: 'inherit',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>✨</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>مساعد Hawsni</div>
                <div style={{ fontSize: 11, opacity: 0.75 }}>أونلاين • يرد فوراً</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none', color: '#fff', cursor: 'pointer',
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, lineHeight: 1,
            }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px 14px',
            background: '#fff', direction: 'rtl',
          }}>
            {messages.map((msg, i) => (
              <div key={i} className={`hwsni-msg-row ${msg.sender}`}>
                <div
                  className={`hwsni-bubble ${msg.sender}`}
                  dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
                />
              </div>
            ))}

            {isLoading && (
              <div className="hwsni-msg-row bot">
                <div className="hwsni-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div style={{
            padding: '10px 14px',
            background: '#fff',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            gap: 8,
            flexShrink: 0,
            direction: 'rtl',
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              disabled={isLoading}
              placeholder="اكتب رسالتك هنا..."
              style={{
                flex: 1,
                padding: '11px 14px',
                border: '1.5px solid #e2e8f0',
                borderRadius: 12,
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: 14,
                background: '#fafafa',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#0E4435'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              style={{
                background: isLoading || !input.trim() ? '#94a3b8' : '#0E4435',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                width: 44,
                height: 44,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s, transform 0.1s',
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* FAB Button */}
      {!isOpen && (
        <button className="hwsni-fab" onClick={() => setIsOpen(true)} aria-label="فتح الشات">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
          </svg>
        </button>
      )}
    </>
  );
}
