export const formatMessageTime = (timestamp: string): string => {
  const now = new Date();
  const messageDate = new Date(timestamp);
  
  // Если сообщение сегодня
  if (messageDate.toDateString() === now.toDateString()) {
    return messageDate.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  // Если сообщение вчера
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Вчера';
  }
  
  // Если сообщение на этой неделе
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (messageDate > weekAgo) {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return days[messageDate.getDay()];
  }
  
  // Если сообщение старше недели
  return messageDate.toLocaleDateString('ru-RU', { 
    day: '2-digit', 
    month: '2-digit' 
  });
};

export const formatLastMessageTime = (timestamp: string): string => {
  const now = new Date();
  const messageDate = new Date(timestamp);
  
  // Если сообщение сегодня
  if (messageDate.toDateString() === now.toDateString()) {
    return messageDate.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  // Если сообщение вчера
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Вчера';
  }
  
  // Если сообщение старше
  return messageDate.toLocaleDateString('ru-RU', { 
    day: '2-digit', 
    month: '2-digit' 
  });
};


