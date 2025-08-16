import React from 'react';
import './ContactList.css';
import { formatLastMessageTime } from '../utils/timeUtils';

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
}

interface ContactListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onContactSelect: (contact: Contact) => void;
}

const ContactList: React.FC<ContactListProps> = ({ 
  contacts, 
  selectedContact, 
  onContactSelect 
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="contact-list">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className={`contact-item ${selectedContact?.id === contact.id ? 'selected' : ''}`}
          onClick={() => onContactSelect(contact)}
        >
          <div className="contact-avatar">
            {contact.avatar ? (
              <img src={contact.avatar} alt={contact.name} />
            ) : (
              <div className="avatar-placeholder">
                {getInitials(contact.name)}
              </div>
            )}
            {contact.isOnline && <div className="online-indicator"></div>}
          </div>
          
          <div className="contact-info">
            <h4 className="contact-name">{contact.name}</h4>
            <p className="last-message">
              {contact.lastMessage || 'Нет сообщений'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContactList;

