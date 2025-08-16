import React from 'react';
import './TypingIndicator.css';

interface TypingIndicatorProps {
  isVisible: boolean;
  contactName?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  isVisible, 
  contactName = 'Кто-то' 
}) => {
  if (!isVisible) return null;

  return (
    <div className="typing-indicator">
      <div className="typing-content">
        <div className="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span className="typing-text">{contactName} печатает...</span>
      </div>
    </div>
  );
};

export default TypingIndicator;


