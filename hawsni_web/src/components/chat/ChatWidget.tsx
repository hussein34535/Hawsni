'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Settings, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

// Environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hwasibackend.vercel.app/api';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Supabase instance — only created if credentials are available
let supabase: ReturnType<typeof createClient> | null = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

interface ChatMessage {
  id?: number;
  sender_type: 'user' | 'bot' | 'admin';
  content: string;
  created_at?: string;
  isOptimistic?: boolean;
}

export default function ChatWidget() {
  const { isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  
   const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll tracking to hide/show FAB (Legendary UX)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show when scrolling up, hide when scrolling down
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);

      // Hide automatically after 2 seconds of scroll inactivity
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsVisible(false);
      }, 2000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial hide after 2 seconds
    timeoutId = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [lastScrollY]);

  // Hide on Checkout/Cart pages
  const shouldHideCompletely = pathname.includes('/checkout') || pathname.includes('/cart');

  // 1. Initialize or Load Session
  useEffect(() => {
    let sid = localStorage.getItem('hwasi_chat_session');
    if (!sid) {
      sid = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('hwasi_chat_session', sid);
    }
    setSessionId(sid);
  }, []);

  // Fetch session data when chat opens, and mark messages as read
  useEffect(() => {
    if (!sessionId) return;
    if (isOpen) {
      fetchSessionData(sessionId);
      markMessagesAsRead(sessionId);
    }
  }, [isOpen, sessionId]);

  // Fetch unread count when sessionId is known (chat closed)
  useEffect(() => {
    if (!sessionId) return;
    fetchUnreadCount(sessionId);
  }, [sessionId]);

  const fetchSessionData = async (sid: string) => {
    try {
      const res = await fetch(`${API_URL}/chat/session/${sid}`);
      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.error('Failed to load chat history', e);
    }
  };

  const fetchUnreadCount = async (sid: string) => {
    try {
      const res = await fetch(`${API_URL}/chat/unread/${sid}`);
      const data = await res.json();
      if (data.success) {
        setUnreadCount(data.unread);
      }
    } catch (e) {
      console.error('Failed to fetch unread count', e);
    }
  };

  const markMessagesAsRead = async (sid: string) => {
    try {
      await fetch(`${API_URL}/chat/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid })
      });
      setUnreadCount(0);
    } catch (e) {
      console.error('Failed to mark messages as read', e);
    }
  };

    // 2. Real-time Subscription to Supabase
    useEffect(() => {
      if (!sessionId || !supabase) return;
      
      // Listen for new messages
      const channel = supabase
        .channel(`public:chat_messages:${sessionId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${sessionId}` },
          (payload) => {
            const newMessage = payload.new as ChatMessage & { is_read?: boolean };
            
            setMessages((prev) => {
              // 1. If it's a message from 'user', we might have an optimistic version
              if (newMessage.sender_type === 'user') {
                // Find and remove the optimistic message
                const filtered = prev.filter(m => !m.isOptimistic || m.content !== newMessage.content);
                // If it was already added by realtime (unlikely but safe), skip
                if (filtered.some(m => m.id === newMessage.id)) return filtered;
                return [...filtered, newMessage];
              }

              // 2. For bot/admin messages, just prevent ID duplication
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });

            // 3. Increment unread count if chat is closed and message is from bot/admin
            if (!isOpen && (newMessage.sender_type === 'bot' || newMessage.sender_type === 'admin')) {
              setUnreadCount(prev => prev + 1);
            }
          }
        )
        .subscribe();
  
      return () => {
        supabase!.removeChannel(channel);
      };
    }, [sessionId, isOpen]);

    // Auto-scroll to latest message
    useEffect(() => {
      // Small delay to ensure rendering is complete
      const timeout = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timeout);
    }, [messages, isLoading]);

    // Focus input when chat opens
    useEffect(() => {
      if (isOpen) {
        setTimeout(() => inputRef.current?.focus(), 200);
        setIsSettingsOpen(false); // Close settings when chat opens
      }
    }, [isOpen]);

    const handleReset = async () => {
      if (!sessionId) return;
      if (!window.confirm(isRTL ? 'هل أنت متأكد من رغبتك في إعادة تعيين الدردشة؟' : 'Are you sure you want to reset the chat?')) return;
      
      setIsLoading(true);
      setIsSettingsOpen(false);
      try {
        const res = await fetch(`${API_URL}/chat/reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });
        if (res.ok) {
          fetchSessionData(sessionId);
        }
      } catch (e) {
        console.error('Reset failed', e);
      } finally {
        setIsLoading(false);
      }
    };

    // 3. Send Message Handler
    const sendMessage = useCallback(async () => {
      const text = input.trim();
      if (!text || isLoading || !sessionId) return;

      // Clear input immediately to feel fast
      setInput('');

      // Add optimistic message (USER ONLY)
      const optimisticMsg: ChatMessage = { sender_type: 'user', content: text, isOptimistic: true };
      setMessages(prev => [...prev, optimisticMsg]);
      setIsLoading(true);

      try {
        const res = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, message: text })
        });
        const data = await res.json();

        if (!data.success) {
          // If API fails, remove optimistic and show error
          setMessages(prev => {
            const filtered = prev.filter(m => m !== optimisticMsg);
            return [...filtered, { sender_type: 'bot', content: 'عذراً، حدث خطأ. حاول تاني.' }];
          });
        }
      } catch (error) {
        setMessages(prev => {
          const filtered = prev.filter(m => m !== optimisticMsg);
          return [...filtered, { sender_type: 'bot', content: 'حدث خطأ في الاتصال بالسيرفر.' }];
        });
      } finally {
        setIsLoading(false);
      }
    }, [input, isLoading, sessionId]);

    const formatText = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\n/g, '<br/>');
    };

    if (shouldHideCompletely) return null;

    return (
      <>
        <style jsx global>{`
          .hwsni-chat-window {
            position: fixed;
            inset: 0;
            z-index: 100000;
            display: flex;
            flex-direction: column;
            background: #fff;
            overflow: hidden;
          }
          @media (min-width: 640px) {
            .hwsni-chat-window {
              inset: auto 24px 100px auto;
              width: 380px;
              height: 600px;
              border-radius: 28px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.15);
              border: 1px solid rgba(0,0,0,0.05);
            }
          }
          .hwsni-bubble {
            max-width: 85%;
            padding: 12px 16px;
            font-size: 14px;
            line-height: 1.6;
            word-break: break-word;
            direction: rtl;
          }
          .hwsni-bubble.user { 
            background: #0E4435; 
            color: #fff; 
            border-radius: 20px 20px 4px 20px; 
          }
          .hwsni-bubble.bot, .hwsni-bubble.admin { 
            background: #f3f4f6; 
            color: #1f2937; 
            border-radius: 20px 20px 20px 4px; 
          }
          
          .hwsni-typing { display: flex; gap: 4px; padding: 12px 16px; background: #f3f4f6; border-radius: 20px; width: fit-content; }
          .hwsni-typing span { width: 6px; height: 6px; background: #9ca3af; border-radius: 50%; animation: hwsniBounce 1.4s infinite; }
          .hwsni-typing span:nth-child(2) { animation-delay: 0.2s; }
          .hwsni-typing span:nth-child(3) { animation-delay: 0.4s; }
          @keyframes hwsniBounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }
        `}</style>
  
        {/* FAB Button - Fixed to Right */}
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: isVisible ? 1 : 0.4, 
                x: isVisible ? 0 : 40,
                y: 0 
              }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: isVisible ? 1.1 : 1, x: 0, opacity: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(true)}
              className="fixed z-[9999] bg-[#0E4435] text-white flex items-center justify-center shadow-xl shadow-emerald-950/20"
              style={{
                bottom: pathname.includes('/product/') ? '120px' : '90px',
                right: '20px',
                width: '56px',
                height: '56px',
                borderRadius: '24px',
              }}
            >
              <MessageCircle size={24} />
              {isVisible && unreadCount > 0 && (
                <motion.span 
                  key={unreadCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white px-1"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.span>
              )}
            </motion.button>
          )}
        </AnimatePresence>
  
        {/* Chat Window */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              className="hwsni-chat-window"
            >
              {/* Header - Swapped X and Name as requested */}
              <div className="bg-[#0E4435] px-6 py-5 flex items-center justify-between flex-shrink-0 relative">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                  <button 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
                    className={`p-2 hover:bg-white/10 rounded-full transition-colors ${isSettingsOpen ? 'bg-white/20 text-white' : 'text-white/70'}`}
                    aria-label="Settings"
                  >
                    <Settings size={18} />
                  </button>
                </div>

                <AnimatePresence>
                  {isSettingsOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-16 left-6 z-50 bg-white shadow-xl rounded-2xl p-2 border border-black/5 min-w-[160px]"
                    >
                      <button 
                        onClick={handleReset}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
                        dir={isRTL ? 'rtl' : 'ltr'}
                      >
                        <RotateCcw size={16} />
                        <span>{isRTL ? 'إعادة تعيين الشات' : 'Reset Chat'}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex items-center gap-3 text-right">
                  <div className="text-right">
                    <h3 className="text-white font-black text-sm">{isRTL ? 'فريق هَوَسي' : 'Hawsni Support'}</h3>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">
                      {isRTL ? 'متاحون الآن لمساعدتك' : 'Online & Ready to Help'}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    <Sparkles className="text-white w-5 h-5" />
                  </div>
                </div>
              </div>
  
              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#fcfcfc] custom-scrollbar">
                {messages.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <MessageCircle className="text-gray-200 w-8 h-8" />
                    </div>
                    <p className="text-gray-400 text-xs font-black leading-relaxed whitespace-pre-line">
                      {isRTL ? 'أهلاً بك في هَوَسي ✨\nنسعد بخدمتك.. كيف يمكننا مساعدتك اليوم؟' : 'Welcome to Hawsni! How can we help you today?'}
                    </p>
                  </div>
                )}
  
                {messages.map((msg, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id || i} 
                    className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`hwsni-bubble ${msg.sender_type}`}
                      style={{ opacity: 1 }}
                      dangerouslySetInnerHTML={{ __html: formatText(msg.content) }}
                    />
                  </motion.div>
                ))}
  
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="hwsni-typing">
                      <span /><span /><span />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
  
              {/* Input Footer */}
              <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  disabled={isLoading}
                  placeholder={isRTL ? 'اكتب استفسارك هنا...' : 'Type your message...'}
                  className="flex-1 bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#0E4435] transition-all outline-none text-right"
                  dir="rtl"
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isLoading || !input.trim() ? 'bg-gray-100 text-gray-300' : 'bg-[#0E4435] text-white shadow-lg shadow-emerald-950/20 active:scale-90 hover:scale-105'}`}
                >
                  <Send size={18} className={isRTL ? 'rotate-0' : ''} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }
