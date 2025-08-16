export const formatLastMessageTime = (timestamp: string): string => {
  const now = new Date();
  const messageTime = new Date();
  
  // Парсим время из строки HH:MM
  const timeMatch = timestamp.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    messageTime.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
  } else {
    // Если не удалось распарсить, возвращаем как есть
    return timestamp;
  }

  const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return 'только что';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} мин`;
  } else if (diffInMinutes < 1440) { // меньше 24 часов
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} ч`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    if (days === 1) {
      return 'вчера';
    } else if (days < 7) {
      return `${days} дн`;
    } else {
      return messageTime.toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  }
};

export const formatMessageTime = (timestamp: string): string => {
  const now = new Date();
  const messageTime = new Date();
  
  // Парсим время из строки HH:MM
  const timeMatch = timestamp.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    messageTime.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
  } else {
    // Если не удалось распарсить, возвращаем как есть
    return timestamp;
  }

  // Если сообщение сегодня, показываем только время
  if (messageTime.toDateString() === now.toDateString()) {
    return timestamp;
  }
  
  // Если сообщение вчера
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (messageTime.toDateString() === yesterday.toDateString()) {
    return `вчера ${timestamp}`;
  }
  
  // Если сообщение на этой неделе
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (messageTime > weekAgo) {
    const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    return `${days[messageTime.getDay()]} ${timestamp}`;
  }
  
  // Если сообщение старше недели
  return messageTime.toLocaleDateString('ru-RU', { 
    day: '2-digit', 
    month: '2-digit' 
  }) + ` ${timestamp}`;
};

export const getCurrentTime = (): string => {
  return new Date().toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

