import React from 'react';
import { Bot, User, ExternalLink, ArrowRight, Sparkles } from 'lucide-react';
import '../../styles/chatbot/ChatMessage.css';

function renderFormattedText(rawText) {
  if (!rawText) return null;

  const lines = rawText.split('\n');

  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={lineIdx} className="h-2" />;
    }

    // Check for bullet point
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
    const lineContent = isBullet ? trimmed.replace(/^[•\-\*]\s*/, '') : line;

    // Parse **bold** markdown tokens
    const parts = lineContent.split(/(\*\*.*?\*\*)/g);
    const parsedTokens = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={partIdx} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    if (isBullet) {
      return (
        <div key={lineIdx} className="flex items-start gap-1.5 my-0.5 pl-1">
          <span className="text-emerald-600 font-bold text-xs select-none">•</span>
          <span className="flex-1 leading-relaxed">{parsedTokens}</span>
        </div>
      );
    }

    return (
      <p key={lineIdx} className="my-0.5 leading-relaxed">
        {parsedTokens}
      </p>
    );
  });
}

export default function ChatMessage({ message }) {
  const isBot = message.sender === 'bot';

  return (
    <div className={`chat-message-row ${isBot ? 'bot-row' : 'user-row'}`}>
      
      <div className={`chat-avatar-icon ${isBot ? 'bot-avatar' : 'user-avatar'}`}>
        {isBot ? (
          <Bot className="w-3.5 h-3.5 text-white" />
        ) : (
          <User className="w-3.5 h-3.5 text-white" />
        )}
      </div>

      <div className={`chat-bubble-box ${isBot ? 'bot-bubble' : 'user-bubble'}`}>
        <div className="chat-bubble-text">
          {isBot ? renderFormattedText(message.text) : message.text}
        </div>

        {/* AI Engine attribution badge */}
        {isBot && (message.aiModel || message.poweredBy) && (
          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400 font-medium">
            <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
            <span>{message.poweredBy || 'Google Gemini AI'}</span>
          </div>
        )}

        {/* Embedded Supervisor Card */}
        {message.recommendation && (
          <div className="embedded-recommendation-card">
            <div className="rec-info">
              <span className="rec-name">{message.recommendation.name}</span>
              <span className="rec-dept">{message.recommendation.designation}</span>
              <span className="rec-papers-badge">{message.recommendation.papers}</span>
            </div>
            <a href={message.recommendation.link} className="rec-view-link">
              <span>View Faculty Profile</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Embedded Journal Link */}
        {message.journalLink && (
          <a
            href={message.journalLink.url}
            target="_blank"
            rel="noreferrer"
            className="embedded-journal-link"
          >
            <span>{message.journalLink.title}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

    </div>
  );
}