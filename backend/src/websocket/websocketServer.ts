import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { ChatMessage, User, TypingEvent, UserRole } from '../models/types';
import { RoomManager } from '../services/RoomManager';
import { LoggingObserver, MetricsObserver, NotificationObserver, AnalyticsObserver } from '../patterns/Observer';

interface ConnectedUser {
  id: string;
  name: string;
  socketId: string;
  currentChat?: string;
  role?: UserRole;
}

class WebSocketServer {
  private io: SocketIOServer;
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private chatRooms: Map<string, Set<string>> = new Map();
  private roomManager: RoomManager;
  private loggingObserver: LoggingObserver;
  private metricsObserver: MetricsObserver;
  private notificationObserver: NotificationObserver;
  private analyticsObserver: AnalyticsObserver;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.roomManager = new RoomManager();
    this.loggingObserver = new LoggingObserver('websocket_logger');
    this.metricsObserver = new MetricsObserver('websocket_metrics');
    this.notificationObserver = new NotificationObserver('websocket_notifications');
    this.analyticsObserver = new AnalyticsObserver('websocket_analytics');

    // Подключаем наблюдателей
    this.roomManager.attach(this.loggingObserver);
    this.roomManager.attach(this.metricsObserver);
    this.roomManager.attach(this.notificationObserver);
    this.roomManager.attach(this.analyticsObserver);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Пользователь подключился: ${socket.id}`);

      // Аутентификация пользователя
      socket.on('authenticate', (data: { userId: string; userName: string }) => {
        this.handleAuthentication(socket, data);
      });

      // Присоединение к чату
      socket.on('joinChat', (data: { chatId: string }) => {
        this.handleJoinChat(socket, data.chatId);
      });

      // Покидание чата
      socket.on('leaveChat', (data: { chatId: string }) => {
        this.handleLeaveChat(socket, data.chatId);
      });

      // Отправка сообщения
      socket.on('sendMessage', (data: { chatId: string; text: string }) => {
        this.handleSendMessage(socket, data);
      });

      // Событие печати
      socket.on('typing', (data: { chatId: string; isTyping: boolean }) => {
        this.handleTyping(socket, data);
      });

      // Отключение пользователя
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Новые события для комнат
      socket.on('getRooms', () => {
        this.handleGetRooms(socket);
      });

      socket.on('joinRoom', (data: { roomId: string; role?: UserRole }) => {
        this.handleJoinRoom(socket, data);
      });

      socket.on('leaveRoom', (data: { roomId: string }) => {
        this.handleLeaveRoom(socket, data);
      });

      socket.on('getRoomParticipants', (data: { roomId: string; page?: number; pageSize?: number }) => {
        this.handleGetRoomParticipants(socket, data);
      });

      socket.on('searchRooms', (data: { query: string }) => {
        this.handleSearchRooms(socket, data);
      });

      socket.on('getRoomStats', (data: { roomId: string }) => {
        this.handleGetRoomStats(socket, data);
      });
    });
  }

  private handleAuthentication(socket: any, data: { userId: string; userName: string }): void {
    const user: ConnectedUser = {
      id: data.userId,
      name: data.userName,
      socketId: socket.id
    };

    this.connectedUsers.set(data.userId, user);
    
    // Уведомляем всех о новом пользователе
    this.broadcastUserStatus();
    
    console.log(`Пользователь аутентифицирован: ${data.userName} (${data.userId})`);
  }

  private handleJoinChat(socket: any, chatId: string): void {
    const user = this.getUserBySocketId(socket.id);
    if (!user) return;

    // Покидаем предыдущий чат
    if (user.currentChat) {
      this.handleLeaveChat(socket, user.currentChat);
    }

    // Присоединяемся к новому чату
    socket.join(chatId);
    user.currentChat = chatId;

    // Добавляем пользователя в комнату чата
    if (!this.chatRooms.has(chatId)) {
      this.chatRooms.set(chatId, new Set());
    }
    this.chatRooms.get(chatId)!.add(user.id);

    console.log(`Пользователь ${user.name} присоединился к чату: ${chatId}`);
  }

  private handleLeaveChat(socket: any, chatId: string): void {
    const user = this.getUserBySocketId(socket.id);
    if (!user) return;

    socket.leave(chatId);
    user.currentChat = undefined;

    // Удаляем пользователя из комнаты чата
    const chatRoom = this.chatRooms.get(chatId);
    if (chatRoom) {
      chatRoom.delete(user.id);
      if (chatRoom.size === 0) {
        this.chatRooms.delete(chatId);
      }
    }

    console.log(`Пользователь ${user.name} покинул чат: ${chatId}`);
  }

  private handleSendMessage(socket: any, data: { chatId: string; text: string }): void {
    const user = this.getUserBySocketId(socket.id);
    if (!user) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      text: data.text,
      senderId: user.id,
      senderName: user.name,
      timestamp: new Date().toISOString(),
      chatId: data.chatId
    };

    // Отправляем сообщение всем участникам чата
    this.io.to(data.chatId).emit('message', message);

    console.log(`Сообщение от ${user.name} в чате ${data.chatId}: ${data.text}`);
  }

  private handleTyping(socket: any, data: { chatId: string; isTyping: boolean }): void {
    const user = this.getUserBySocketId(socket.id);
    if (!user) return;

    const typingEvent: TypingEvent = {
      userId: user.id,
      userName: user.name,
      chatId: data.chatId,
      isTyping: data.isTyping
    };

    // Отправляем событие печати всем участникам чата, кроме отправителя
    socket.to(data.chatId).emit('typing', typingEvent);

    if (data.isTyping) {
      console.log(`Пользователь ${user.name} печатает в чате ${data.chatId}`);
    }
  }

  private handleDisconnect(socket: any): void {
    const user = this.getUserBySocketId(socket.id);
    if (user) {
      // Удаляем пользователя из всех чатов
      if (user.currentChat) {
        this.handleLeaveChat(socket, user.currentChat);
      }

      // Удаляем пользователя из списка подключенных
      this.connectedUsers.delete(user.id);

      // Уведомляем всех об отключении пользователя
      this.broadcastUserStatus();

      console.log(`Пользователь отключился: ${user.name} (${user.id})`);
    }
  }

  private getUserBySocketId(socketId: string): ConnectedUser | undefined {
    for (const user of this.connectedUsers.values()) {
      if (user.socketId === socketId) {
        return user;
      }
    }
    return undefined;
  }

  private broadcastUserStatus(): void {
    const users: User[] = Array.from(this.connectedUsers.values()).map(user => ({
      id: user.id,
      name: user.name,
      isOnline: true,
      lastSeen: new Date().toISOString()
    }));

    this.io.emit('userStatus', users);
  }

  // Публичные методы для внешнего использования
  public getIO(): SocketIOServer {
    return this.io;
  }

  public getConnectedUsers(): User[] {
    return Array.from(this.connectedUsers.values()).map(user => ({
      id: user.id,
      name: user.name,
      isOnline: true,
      lastSeen: new Date().toISOString(),
      role: user.role
    }));
  }

  // Новые обработчики для комнат
  private handleGetRooms(socket: any): void {
    const user = this.getUserBySocketId(socket.id);
    if (!user) return;

    const publicRooms = this.roomManager.getPublicRooms();
    const userRooms = this.roomManager.getUserRooms(user.id);
    
    socket.emit('roomsList', {
      public: publicRooms,
      user: userRooms
    });
  }

  private handleJoinRoom(socket: any, data: { roomId: string; role?: UserRole }): void {
    const user = this.getUserBySocketId(socket.id);
    if (!user) return;

    const success = this.roomManager.joinRoom(data.roomId, user.id, user.name, data.role);
    if (success) {
      socket.join(data.roomId);
      socket.emit('roomJoined', { roomId: data.roomId, success: true });
      
      // Уведомляем других участников комнаты
      socket.to(data.roomId).emit('userJoinedRoom', {
        roomId: data.roomId,
        user: { id: user.id, name: user.name, role: data.role || UserRole.USER }
      });
    } else {
      socket.emit('roomJoined', { roomId: data.roomId, success: false, error: 'Не удалось присоединиться к комнате' });
    }
  }

  private handleLeaveRoom(socket: any, data: { roomId: string }): void {
    const user = this.getUserBySocketId(socket.id);
    if (!user) return;

    const success = this.roomManager.leaveRoom(data.roomId, user.id);
    if (success) {
      socket.leave(data.roomId);
      socket.emit('roomLeft', { roomId: data.roomId, success: true });
      
      // Уведомляем других участников комнаты
      socket.to(data.roomId).emit('userLeftRoom', {
        roomId: data.roomId,
        user: { id: user.id, name: user.name }
      });
    } else {
      socket.emit('roomLeft', { roomId: data.roomId, success: false, error: 'Не удалось покинуть комнату' });
    }
  }

  private handleGetRoomParticipants(socket: any, data: { roomId: string; page?: number; pageSize?: number }): void {
    const participants = this.roomManager.getRoomParticipantsVirtual(
      data.roomId, 
      data.page || 0, 
      data.pageSize || 20
    );
    
    socket.emit('roomParticipants', participants);
  }

  private handleSearchRooms(socket: any, data: { query: string }): void {
    const user = this.getUserBySocketId(socket.id);
    const rooms = this.roomManager.searchRooms(data.query, user?.id);
    
    socket.emit('roomsSearchResult', { query: data.query, rooms });
  }

  private handleGetRoomStats(socket: any, data: { roomId: string }): void {
    const stats = this.roomManager.getRoomStats(data.roomId);
    socket.emit('roomStats', { roomId: data.roomId, stats });
  }

  public sendMessageToChat(chatId: string, message: ChatMessage): void {
    this.io.to(chatId).emit('message', message);
  }

  public sendTypingToChat(chatId: string, typingEvent: TypingEvent): void {
    this.io.to(chatId).emit('typing', typingEvent);
  }
}

export default WebSocketServer;
