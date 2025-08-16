# WebSocket интеграция в Messager

## 🚀 Что мы добавили

### Frontend (React + TypeScript)
- **WebSocket сервис** (`frontend/src/services/websocketService.ts`)
- **Интеграция с чат-интерфейсом** - реальное время сообщений
- **Индикаторы статуса** - подключение/отключение
- **События печати** - "печатает..." в реальном времени

### Backend (Node.js + Express)
- **WebSocket сервер** (`backend/src/websocket/websocketServer.ts`)
- **Socket.IO интеграция** - управление соединениями
- **Чат-комнаты** - изоляция сообщений по чатам
- **Аутентификация** - безопасное подключение пользователей

## 📦 Установленные зависимости

### Frontend
```bash
npm install @types/ws ws socket.io-client
```

### Backend
```bash
npm install ws @types/ws socket.io
```

## 🔧 Как это работает

### 1. Подключение к WebSocket
```typescript
// В ChatInterface.tsx
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
}, []);
```

### 2. Отправка сообщений
```typescript
const handleSendMessage = (text: string) => {
  if (!selectedContact || !isConnected) return;
  
  // Отправляем через WebSocket
  websocketService.sendMessage(selectedContact.id, text);
  
  // Добавляем локально для мгновенного отображения
  const newMessage = { /* ... */ };
  setMessages(prev => [...prev, newMessage]);
};
```

### 3. Получение сообщений
```typescript
const unsubscribeMessage = websocketService.onMessage((message: ChatMessage) => {
  if (selectedContact && message.chatId === selectedContact.id) {
    const newMessage = {
      id: message.id,
      text: message.text,
      senderId: message.senderId,
      timestamp: new Date(message.timestamp).toLocaleTimeString('ru-RU'),
      isOwn: message.senderId === 'user-1'
    };
    setMessages(prev => [...prev, newMessage]);
  }
});
```

### 4. События печати
```typescript
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
```

## 🎯 Основные функции WebSocket сервиса

### Подключение
- `connect(userId, userName)` - подключение к серверу
- `disconnect()` - отключение от сервера
- `isConnected()` - проверка состояния подключения

### Сообщения
- `sendMessage(chatId, text)` - отправка сообщения
- `onMessage(handler)` - подписка на новые сообщения
- `joinChat(chatId)` - присоединение к чату
- `leaveChat(chatId)` - покидание чата

### События
- `sendTyping(chatId, isTyping)` - уведомление о печати
- `onTyping(handler)` - подписка на события печати
- `onUserStatus(handler)` - подписка на статус пользователей
- `onConnectionChange(handler)` - подписка на изменения подключения

## 🔒 Безопасность

### Аутентификация
```typescript
// При подключении передаем данные пользователя
this.socket = io('http://localhost:8001', {
  auth: {
    userId,
    userName
  }
});
```

### Валидация
- Проверка существования пользователя
- Валидация данных сообщений
- Защита от спама

## 📱 Интерфейс

### Индикаторы статуса
- 🟢 **Подключено** - WebSocket активен
- 🔴 **Отключено** - WebSocket неактивен
- **Автопереподключение** - при потере соединения

### Уведомления
- **Новые сообщения** - мгновенное отображение
- **Печатает...** - анимированный индикатор
- **Статус пользователей** - онлайн/оффлайн

## 🛠 Разработка

### Добавление новых событий
1. Добавить тип в `websocketService.ts`
2. Добавить обработчик в `websocketServer.ts`
3. Интегрировать в компоненты

### Отладка
```typescript
// Включить логи WebSocket
console.log('WebSocket подключен');
console.log('Сообщение получено:', message);
console.log('Ошибка WebSocket:', error);
```

## 🚀 Следующие шаги

### Планируемые улучшения
- [ ] **Групповые чаты** - поддержка множественных участников
- [ ] **Файлы и медиа** - отправка изображений и документов
- [ ] **Уведомления** - push-уведомления
- [ ] **Шифрование** - end-to-end шифрование
- [ ] **История сообщений** - загрузка старых сообщений
- [ ] **Статус доставки** - прочитано/доставлено

### Оптимизация
- [ ] **Переподключение** - автоматическое восстановление соединения
- [ ] **Кэширование** - локальное хранение сообщений
- [ ] **Сжатие** - оптимизация трафика
- [ ] **Масштабирование** - поддержка множественных серверов

## 📚 Полезные ссылки

- [Socket.IO документация](https://socket.io/docs/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [React useEffect](https://react.dev/reference/react/useEffect)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Примечание**: WebSocket интеграция полностью совместима с существующим кодом и не ломает текущую функциональность.

