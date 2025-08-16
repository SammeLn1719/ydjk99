import React, { useState, useMemo, useEffect } from 'react';
import './ChatInterface.css';
import ContactList from './ContactList';
import ChatArea from './ChatArea';
import SearchBar from './SearchBar';
import { websocketService, ChatMessage, User, TypingEvent } from '../services/websocketService';

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

const ChatInterface: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: '1',
      name: 'Алексей',
      lastMessage: 'Привет!',
      lastMessageTime: '19:25',
      unreadCount: 0,
      isOnline: true
    },
    {
      id: '2',
      name: 'Мария',
      lastMessage: 'Как дела?',
      lastMessageTime: '18:45',
      unreadCount: 0,
      isOnline: false
    },
    {
      id: '3',
      name: 'Дмитрий',
      lastMessage: 'Спасибо!',
      lastMessageTime: '17:20',
      unreadCount: 0,
      isOnline: true
    }
  ]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contacts, searchQuery]);

  // Инициализация WebSocket при монтировании компонента
  useEffect(() => {
    const connectToWebSocket = async () => {
      try {
        await websocketService.connect('user-1', 'Пользователь');
        setIsConnected(true);
      } catch (error) {
        console.error('Ошибка подключения к WebSocket:', error);
      }
    };

    connectToWebSocket();

    // Подписка на события WebSocket
    const unsubscribeMessage = websocketService.onMessage((message: ChatMessage) => {
      if (selectedContact && message.chatId === selectedContact.id) {
        const newMessage: Message = {
          id: message.id,
          text: message.text,
          senderId: message.senderId,
          timestamp: new Date(message.timestamp).toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isOwn: message.senderId === 'user-1'
        };
        setMessages(prev => [...prev, newMessage]);
      }

      // Обновляем последнее сообщение в списке контактов
      setContacts(prev => prev.map(contact => {
        if (contact.id === message.chatId) {
          return {
            ...contact,
            lastMessage: message.text,
            lastMessageTime: new Date(message.timestamp).toLocaleTimeString('ru-RU', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            unreadCount: selectedContact?.id === message.chatId ? contact.unreadCount : (contact.unreadCount || 0) + 1
          };
        }
        return contact;
      }));
    });

    const unsubscribeTyping = websocketService.onTyping((event: TypingEvent) => {
      if (selectedContact && event.chatId === selectedContact.id) {
        if (event.isTyping) {
          setTypingUsers(prev => new Set(prev).add(event.userName));
        } else {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(event.userName);
            return newSet;
          });
        }
      }
    });

    const unsubscribeConnection = websocketService.onConnectionChange((connected: boolean) => {
      setIsConnected(connected);
    });

    const unsubscribeUserStatus = websocketService.onUserStatus((users: User[]) => {
      // Обновляем статус онлайн для контактов
      setContacts(prev => prev.map(contact => {
        const onlineUser = users.find(user => user.name === contact.name);
        return {
          ...contact,
          isOnline: onlineUser?.isOnline || false
        };
      }));
    });

    // Очистка при размонтировании
    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
      unsubscribeConnection();
      unsubscribeUserStatus();
      websocketService.disconnect();
    };
  }, [selectedContact]);

  // Обновление времени каждую минуту
  useEffect(() => {
    const interval = setInterval(() => {
      setContacts(prev => prev.map(contact => {
        const lastMessageTime = contact.lastMessageTime;
        if (lastMessageTime && !lastMessageTime.includes(':')) {
          // Если время не в формате HH:MM, обновляем его
          return {
            ...contact,
            lastMessageTime: new Date().toLocaleTimeString('ru-RU', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          };
        }
        return contact;
      }));
    }, 60000); // Обновляем каждую минуту

    return () => clearInterval(interval);
  }, []);

  // Обработка выбора контакта
  const handleContactSelect = (contact: Contact) => {
    if (selectedContact) {
      websocketService.leaveChat(selectedContact.id);
    }
    setSelectedContact(contact);
    setMessages([]);
    setTypingUsers(new Set());
    websocketService.joinChat(contact.id);

    // Сбрасываем непрочитанные сообщения для выбранного контакта
    setContacts(prev => prev.map(c => 
      c.id === contact.id ? { ...c, unreadCount: 0 } : c
    ));
  };

  const handleSendMessage = (text: string) => {
    if (!selectedContact || !isConnected) return;

    // Отправляем сообщение через WebSocket
    websocketService.sendMessage(selectedContact.id, text);

    // Добавляем сообщение локально для мгновенного отображения
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      senderId: 'user-1',
      timestamp: new Date().toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isOwn: true
    };
    setMessages(prev => [...prev, newMessage]);

    // Обновляем последнее сообщение в списке контактов
    setContacts(prev => prev.map(contact => {
      if (contact.id === selectedContact.id) {
        return {
          ...contact,
          lastMessage: text,
          lastMessageTime: new Date().toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          unreadCount: 0
        };
      }
      return contact;
    }));

    // Симулируем ответ от собеседника через 2-5 секунд
    setTimeout(() => {
      const responses = [
        'Понял',
        'Хорошо',
        'Согласен',
        'Спасибо'
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const responseMessage: Message = {
        id: Date.now().toString(),
        text: randomResponse,
        senderId: selectedContact.id,
        timestamp: new Date().toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isOwn: false
      };
      
      setMessages(prev => [...prev, responseMessage]);
      
      // Обновляем последнее сообщение в списке контактов
      setContacts(prev => prev.map(contact => {
        if (contact.id === selectedContact.id) {
          return {
            ...contact,
            lastMessage: randomResponse,
            lastMessageTime: new Date().toLocaleTimeString('ru-RU', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            unreadCount: 0
          };
        }
        return contact;
      }));
    }, 2000 + Math.random() * 3000);
  };

  return (
    <div className="chat-interface">
              <div className="sidebar">
          <div className="sidebar-header">
            <h2>Чаты</h2>
          </div>
        <SearchBar onSearch={setSearchQuery} />
        <ContactList 
          contacts={filteredContacts}
          selectedContact={selectedContact}
          onContactSelect={handleContactSelect}
        />
      </div>
      <div className="chat-area">
        {selectedContact ? (
          <ChatArea 
            contact={selectedContact}
            messages={messages}
            onSendMessage={handleSendMessage}
            isConnected={isConnected}
            typingUsers={Array.from(typingUsers)}
          />
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-content">
              <h2>Выберите чат</h2>
              <p>Выберите контакт или группу из списка слева, чтобы начать общение</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
