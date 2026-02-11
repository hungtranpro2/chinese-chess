'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../hooks/useChat';

interface ChatPanelProps {
  messages: ChatMessage[];
  unreadCount: number;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  onSendMessage: (text: string) => void;
}

export default function ChatPanel({ messages, unreadCount, isOpen, onToggle, onSendMessage }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll khi có tin nhắn mới
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle button */}
      <button
        onClick={() => onToggle(!isOpen)}
        className="absolute bottom-0 right-0 w-12 h-12 bg-amber-700 text-white rounded-full shadow-lg hover:bg-amber-800 transition-colors flex items-center justify-center"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-80 h-96 bg-white border-2 border-amber-300 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-2 bg-amber-700 text-white font-bold text-sm">
            Chat
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {messages.length === 0 && (
              <p className="text-gray-400 text-center text-sm py-4">Chưa có tin nhắn</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                <span className={`text-xs font-medium mb-0.5 ${msg.color === 'red' ? 'text-red-600' : 'text-gray-600'}`}>
                  {msg.sender}
                </span>
                <div className={`px-3 py-1.5 rounded-lg max-w-[85%] text-sm break-words ${
                  msg.isOwn
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-amber-200 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              maxLength={200}
              className="flex-1 px-3 py-1.5 border border-amber-300 rounded-lg text-sm focus:outline-none focus:border-amber-500 text-gray-800 placeholder-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-3 py-1.5 bg-amber-700 text-white rounded-lg text-sm hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
