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
    { sender: 'bot', text: 'مرحباً بك في Hawsni للفخامة والأزياء ✨\nكيف يمكنني مساعدتك اليوم؟ يمكنني مساعدتك في تصفح المنتجات أو تتبع طلبك.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Array<{role: string; parts: Array<{text: string}>}>>([]);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setMessages(prev => [...prev, { sender: 'user', text }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history })
      });
      const data = await res.json();

      if (data.success) {
        setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
        setHistory(data.history);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: 'عذراً، حدث خطأ. يرجى المحاولة لاحقاً.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { sender: 'bot', text: 'لا يمكن الاتصال بالخادم الآن. يرجى المحاولة لاحقاً.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, history]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') sendMessage();
  };

  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '16px',
            width: '350px',
            maxWidth: 'calc(100vw - 32px)',
            height: '500px',
            maxHeight: '70vh',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            zIndex: 99999,
            animation: 'chatSlideUp 0.3s ease',
            direction: 'rtl',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: '#0E4435',
              color: 'white',
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>✨ مساعد Hawsni</h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '20px',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            ref={chatBodyRef}
            style={{
              flex: 1,
              padding: '14px',
              overflowY: 'auto',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: msg.sender === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  fontSize: '13.5px',
                  lineHeight: 1.6,
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.sender === 'user' ? '#0E4435' : '#fff',
                  color: msg.sender === 'user' ? '#fff' : '#1e293b',
                  border: msg.sender === 'bot' ? '1px solid #e2e8f0' : 'none',
                  wordBreak: 'break-word',
                }}
                dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
              />
            ))}

            {isLoading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  fontSize: '12px',
                  color: '#64748b',
                  padding: '6px 0',
                }}
              >
                المساعد يكتب...
              </div>
            )}
          </div>

          {/* Input */}
          <div
            style={{
              padding: '10px 12px',
              background: '#fff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              placeholder="اكتب رسالتك..."
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: '13px',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading}
              style={{
                background: '#0E4435',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0 16px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontFamily: 'inherit',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              إرسال
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '16px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#0E4435',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            border: 'none',
            zIndex: 99999,
            transition: 'transform 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
          </svg>
        </button>
      )}

      {/* Animation */}
      <style jsx global>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
