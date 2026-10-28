import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { useChat } from '../../context/ChatContext';
import api from '../../services/api';
import '../../styles/chatbot/ChatWindow.css';

export default function ChatWindow({ onClose }) {
  const { messages, sendMessage, isTyping } = useChat();
  const [inputMessage, setInputMessage] = useState('');
  const [aiStatus, setAiStatus] = useState({ geminiEnabled: false, model: '' });
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    'Recommend NLP Supervisor',
    '3-Stage Defense Rubrics',
    'How to find IEEE papers?',
    'Download LaTeX package'
  ];

  useEffect(() => {
    api.getChatStatus().then((res) => {
      if (res && res.ok) {
        setAiStatus({ geminiEnabled: res.geminiEnabled, model: res.model });
      }
    }).catch(() => {});
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text || !text.trim() || isTyping) return;

    sendMessage(text.trim());
    setInputMessage('');
  };

  return (
    <div className="chat-window-container">
      
      {/* Header */}
      <div className="chat-window-header">
        <div className="chat-header-info">
          <div className="chat-header-bot-circle bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-500">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="chat-header-title">ThesisVerse Assistant</h4>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 text-[9px] font-semibold tracking-wide border border-indigo-400/30">
                <Sparkles className="w-2.5 h-2.5 text-indigo-300" />
                <span>{aiStatus.geminiEnabled ? 'Gemini AI' : 'Smart AI'}</span>
              </span>
            </div>
            <div className="chat-status-row">
              <span className="online-indicator-dot"></span>
              <span className="online-status-text">
                {aiStatus.geminiEnabled ? 'Powered by Google Gemini' : 'Active & Ready'}
              </span>
            </div>
          </div>
        </div>

        <button type="button" className="chat-header-close-btn" onClick={onClose} aria-label="Close chat">
          <X className="w-4 h-4 text-slate-300 hover:text-white" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="chat-messages-area">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isTyping && (
          <div className="chat-message-row bot-row">
            <div className="chat-avatar-icon bot-avatar">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="chat-bubble-box bot-bubble flex items-center gap-2 py-2.5 px-3">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse [animation-delay:150ms]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse [animation-delay:300ms]"></span>
              </div>
              <span className="text-[11px] text-slate-500 italic">
                {aiStatus.geminiEnabled ? 'Gemini AI is generating response...' : 'Consulting IIUC knowledge base...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="chat-suggestion-chips-row">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            className="suggestion-chip-btn"
            disabled={isTyping}
            onClick={() => handleSend(prompt)}
          >
            <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        className="chat-input-wrapper"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          type="text"
          className="chat-input-field"
          placeholder="Ask about supervisors, defense rubrics, IEEE papers..."
          value={inputMessage}
          disabled={isTyping}
          onChange={(e) => setInputMessage(e.target.value)}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!inputMessage.trim() || isTyping}
          aria-label="Send message"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>

    </div>
  );
}