import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  chatId: string;
}

export interface User {
  id: string;
  name: string;
  isOnline: boolean;
  lastSeen?: string;
  role?: UserRole;
}

export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
  OBSERVER = 'observer'
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  type: RoomType;
  participants: RoomParticipant[];
  maxParticipants: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum RoomType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  RESTRICTED = 'restricted',
  ANNOUNCEMENT = 'announcement'
}

export interface RoomParticipant {
  userId: string;
  userName: string;
  role: UserRole;
  joinedAt: string;
  lastActivity?: string;
}

export interface TypingEvent {
  userId: string;
  userName: string;
  chatId: string;
  isTyping: boolean;
}

class WebSocketService {
  private socket: Socket | null = null;
  private messageHandlers: ((message: ChatMessage) => void)[] = [];
  private typingHandlers: ((event: TypingEvent) => void)[] = [];
  private userStatusHandlers: ((users: User[]) => void)[] = [];
  private connectionHandlers: ((connected: boolean) => void)[] = [];
  private roomHandlers: ((event: string, data: any) => void)[] = [];

  // Подключение к серверу
  connect(userId: string, userName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io('http://localhost:8001', {
          auth: {
            userId,
            userName
          }
        });

        this.socket.on('connect', () => {
          console.log('WebSocket подключен');
          this.notifyConnectionHandlers(true);
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('WebSocket отключен');
          this.notifyConnectionHandlers(false);
        });

        this.socket.on('error', (error) => {
          console.error('WebSocket ошибка:', error);
          reject(error);
        });

        // Обработка входящих сообщений
        this.socket.on('message', (message: ChatMessage) => {
          this.notifyMessageHandlers(message);
        });

        // Обработка событий печати
        this.socket.on('typing', (event: TypingEvent) => {
          this.notifyTypingHandlers(event);
        });

        // Обработка обновлений статуса пользователей
        this.socket.on('userStatus', (users: User[]) => {
          this.notifyUserStatusHandlers(users);
        });

        // Обработка событий комнат
        this.socket.on('roomsList', (data: { public: Room[]; user: Room[] }) => {
          this.notifyRoomHandlers('roomsList', data);
        });

        this.socket.on('roomJoined', (data: { roomId: string; success: boolean; error?: string }) => {
          this.notifyRoomHandlers('roomJoined', data);
        });

        this.socket.on('roomLeft', (data: { roomId: string; success: boolean; error?: string }) => {
          this.notifyRoomHandlers('roomLeft', data);
        });

        this.socket.on('roomParticipants', (data: { participants: RoomParticipant[]; total: number; page: number; pageSize: number; hasMore: boolean }) => {
          this.notifyRoomHandlers('roomParticipants', data);
        });

        this.socket.on('roomsSearchResult', (data: { query: string; rooms: Room[] }) => {
          this.notifyRoomHandlers('roomsSearchResult', data);
        });

        this.socket.on('roomStats', (data: { roomId: string; stats: any }) => {
          this.notifyRoomHandlers('roomStats', data);
        });

        this.socket.on('userJoinedRoom', (data: { roomId: string; user: { id: string; name: string; role: UserRole } }) => {
          this.notifyRoomHandlers('userJoinedRoom', data);
        });

        this.socket.on('userLeftRoom', (data: { roomId: string; user: { id: string; name: string } }) => {
          this.notifyRoomHandlers('userLeftRoom', data);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  // Отключение от сервера
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Отправка сообщения
  sendMessage(chatId: string, text: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('sendMessage', { chatId, text });
    } else {
      console.error('WebSocket не подключен');
    }
  }

  // Уведомление о печати
  sendTyping(chatId: string, isTyping: boolean): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing', { chatId, isTyping });
    }
  }

  // Присоединение к чату
  joinChat(chatId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('joinChat', { chatId });
    }
  }

  // Покидание чата
  leaveChat(chatId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leaveChat', { chatId });
    }
  }

  // Подписка на новые сообщения
  onMessage(handler: (message: ChatMessage) => void): () => void {
    this.messageHandlers.push(handler);
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  // Подписка на события печати
  onTyping(handler: (event: TypingEvent) => void): () => void {
    this.typingHandlers.push(handler);
    return () => {
      const index = this.typingHandlers.indexOf(handler);
      if (index > -1) {
        this.typingHandlers.splice(index, 1);
      }
    };
  }

  // Подписка на обновления статуса пользователей
  onUserStatus(handler: (users: User[]) => void): () => void {
    this.userStatusHandlers.push(handler);
    return () => {
      const index = this.userStatusHandlers.indexOf(handler);
      if (index > -1) {
        this.userStatusHandlers.splice(index, 1);
      }
    };
  }

  // Подписка на изменения состояния подключения
  onConnectionChange(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.push(handler);
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  // Проверка состояния подключения
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Уведомление обработчиков сообщений
  private notifyMessageHandlers(message: ChatMessage): void {
    this.messageHandlers.forEach(handler => handler(message));
  }

  // Уведомление обработчиков печати
  private notifyTypingHandlers(event: TypingEvent): void {
    this.typingHandlers.forEach(handler => handler(event));
  }

  // Уведомление обработчиков статуса пользователей
  private notifyUserStatusHandlers(users: User[]): void {
    this.userStatusHandlers.forEach(handler => handler(users));
  }

  // Уведомление обработчиков подключения
  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => handler(connected));
  }

  // Методы для работы с комнатами
  getRooms(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('getRooms');
    }
  }

  joinRoom(roomId: string, role?: UserRole): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('joinRoom', { roomId, role });
    }
  }

  leaveRoom(roomId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leaveRoom', { roomId });
    }
  }

  getRoomParticipants(roomId: string, page?: number, pageSize?: number): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('getRoomParticipants', { roomId, page, pageSize });
    }
  }

  searchRooms(query: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('searchRooms', { query });
    }
  }

  getRoomStats(roomId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('getRoomStats', { roomId });
    }
  }

  // Подписка на события комнат
  onRoomEvent(handler: (event: string, data: any) => void): () => void {
    this.roomHandlers.push(handler);
    return () => {
      const index = this.roomHandlers.indexOf(handler);
      if (index > -1) {
        this.roomHandlers.splice(index, 1);
      }
    };
  }

  private notifyRoomHandlers(event: string, data: any): void {
    this.roomHandlers.forEach(handler => {
      try {
        handler(event, data);
      } catch (error) {
        console.error('Ошибка в обработчике комнат:', error);
      }
    });
  }
}

// Экспортируем единственный экземпляр сервиса
export const websocketService = new WebSocketService();
