import React, { useState, useRef, useEffect } from 'react';
import './ChatArea.css';
import TypingIndicator from './TypingIndicator';

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
  isOwn: boolean;
}

interface ChatAreaProps {
  contact: Contact;
  messages: Message[];
  onSendMessage: (text: string) => void;
  isConnected?: boolean;
  typingUsers?: string[];
}

const ChatArea: React.FC<ChatAreaProps> = ({ 
  contact, 
  messages, 
  onSendMessage, 
  isConnected = true, 
  typingUsers = [] 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && isConnected) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div className="chat-contact-info">
          <div className="chat-contact-avatar">
            {contact.avatar ? (
              <img src={contact.avatar} alt={contact.name} />
            ) : (
              <div className="avatar-placeholder">
                {getInitials(contact.name)}
              </div>
            )}
            {contact.isOnline && <div className="online-indicator"></div>}
          </div>
          <div className="chat-contact-details">
            <h3 className="chat-contact-name">{contact.name}</h3>
            <span className="chat-contact-status">
              {contact.isOnline ? 'онлайн' : 'не в сети'}
            </span>
          </div>
        </div>
      </div>

      <div className="messages-container">
        <div className="messages-list">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.isOwn ? 'own-message' : 'other-message'}`}
            >
              <div className="message-content">
                <p className="message-text">{message.text}</p>
                <span className="message-time">{message.timestamp}</span>
              </div>
            </div>
          ))}
          {typingUsers.length > 0 && (
            <TypingIndicator 
              isVisible={true} 
              contactName={typingUsers.join(', ')} 
            />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form className="message-input-container" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="message-input"
          placeholder="Введите сообщение..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit" className="send-btn" disabled={!newMessage.trim() || !isConnected}>
          ➤
        </button>
      </form>
    </div>
  );
};

export default ChatArea;
