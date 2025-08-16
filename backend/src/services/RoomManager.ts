import { Room, RoomType, RoomParticipant, UserRole } from '../models/types';
import { EventSubject, Observer } from '../patterns/Observer';

export class RoomManager extends EventSubject {
  private rooms: Map<string, Room> = new Map();
  private userRooms: Map<string, Set<string>> = new Map(); // userId -> Set<roomId>

  constructor() {
    super();
    this.initializeDefaultRooms();
  }

  private initializeDefaultRooms(): void {
    // Создаем несколько комнат по умолчанию
    this.createRoom({
      id: 'general',
      name: 'Общий чат',
      description: 'Основная комната для общения',
      type: RoomType.PUBLIC,
      maxParticipants: 100
    });

    this.createRoom({
      id: 'announcements',
      name: 'Объявления',
      description: 'Важные объявления',
      type: RoomType.ANNOUNCEMENT,
      maxParticipants: 1000
    });

    this.createRoom({
      id: 'support',
      name: 'Поддержка',
      description: 'Техническая поддержка',
      type: RoomType.RESTRICTED,
      maxParticipants: 50
    });
  }

  createRoom(roomData: Partial<Room>): Room {
    const room: Room = {
      id: roomData.id || this.generateRoomId(),
      name: roomData.name || 'Новая комната',
      description: roomData.description,
      type: roomData.type || RoomType.PUBLIC,
      participants: [],
      maxParticipants: roomData.maxParticipants || 50,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.rooms.set(room.id, room);
    this.notify('roomCreated', room);
    return room;
  }

  deleteRoom(roomId: string, adminUserId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    // Проверяем права администратора
    const admin = room.participants.find(p => p.userId === adminUserId && p.role === UserRole.ADMIN);
    if (!admin) return false;

    this.rooms.delete(roomId);
    
    // Удаляем комнату из списков пользователей
    room.participants.forEach(participant => {
      const userRooms = this.userRooms.get(participant.userId);
      if (userRooms) {
        userRooms.delete(roomId);
      }
    });

    this.notify('roomDeleted', { roomId, deletedBy: adminUserId });
    return true;
  }

  joinRoom(roomId: string, userId: string, userName: string, role: UserRole = UserRole.USER): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !room.isActive) return false;

    // Проверяем лимит участников
    if (room.participants.length >= room.maxParticipants) return false;

    // Проверяем, не находится ли пользователь уже в комнате
    const existingParticipant = room.participants.find(p => p.userId === userId);
    if (existingParticipant) return false;

    const participant: RoomParticipant = {
      userId,
      userName,
      role,
      joinedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    room.participants.push(participant);
    room.updatedAt = new Date().toISOString();

    // Добавляем комнату в список пользователя
    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId)!.add(roomId);

    this.notify('userJoinedRoom', { roomId, participant });
    return true;
  }

  leaveRoom(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const participantIndex = room.participants.findIndex(p => p.userId === userId);
    if (participantIndex === -1) return false;

    const participant = room.participants[participantIndex];
    room.participants.splice(participantIndex, 1);
    room.updatedAt = new Date().toISOString();

    // Удаляем комнату из списка пользователя
    const userRooms = this.userRooms.get(userId);
    if (userRooms) {
      userRooms.delete(roomId);
    }

    this.notify('userLeftRoom', { roomId, participant });
    return true;
  }

  updateUserRole(roomId: string, userId: string, newRole: UserRole, adminUserId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    // Проверяем права администратора
    const admin = room.participants.find(p => p.userId === adminUserId && p.role === UserRole.ADMIN);
    if (!admin) return false;

    const participant = room.participants.find(p => p.userId === userId);
    if (!participant) return false;

    participant.role = newRole;
    participant.lastActivity = new Date().toISOString();
    room.updatedAt = new Date().toISOString();

    this.notify('userRoleUpdated', { roomId, userId, newRole, updatedBy: adminUserId });
    return true;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomsByType(type: RoomType): Room[] {
    return Array.from(this.rooms.values()).filter(room => room.type === type);
  }

  getPublicRooms(): Room[] {
    return this.getRoomsByType(RoomType.PUBLIC);
  }

  getUserRooms(userId: string): Room[] {
    const userRoomIds = this.userRooms.get(userId);
    if (!userRoomIds) return [];

    return Array.from(userRoomIds)
      .map(roomId => this.rooms.get(roomId))
      .filter(room => room !== undefined) as Room[];
  }

  getRoomParticipants(roomId: string): RoomParticipant[] {
    const room = this.rooms.get(roomId);
    return room ? room.participants : [];
  }

  // Виртуальный список - возвращает участников с пагинацией
  getRoomParticipantsVirtual(roomId: string, page: number = 0, pageSize: number = 20): {
    participants: RoomParticipant[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  } {
    const participants = this.getRoomParticipants(roomId);
    const start = page * pageSize;
    const end = start + pageSize;
    const paginatedParticipants = participants.slice(start, end);

    return {
      participants: paginatedParticipants,
      total: participants.length,
      page,
      pageSize,
      hasMore: end < participants.length
    };
  }

  // Поиск комнат
  searchRooms(query: string, userId?: string): Room[] {
    const searchTerm = query.toLowerCase();
    let rooms = Array.from(this.rooms.values());

    // Фильтруем по типу комнаты для пользователя
    if (userId) {
      const userRoomIds = this.userRooms.get(userId) || new Set();
      rooms = rooms.filter(room => 
        room.type === RoomType.PUBLIC || 
        userRoomIds.has(room.id)
      );
    }

    return rooms.filter(room =>
      room.name.toLowerCase().includes(searchTerm) ||
      room.description?.toLowerCase().includes(searchTerm)
    );
  }

  // Статистика
  getRoomStats(roomId: string): {
    totalParticipants: number;
    onlineParticipants: number;
    admins: number;
    moderators: number;
    users: number;
    observers: number;
  } {
    const participants = this.getRoomParticipants(roomId);
    
    return {
      totalParticipants: participants.length,
      onlineParticipants: participants.length, // Упрощенно
      admins: participants.filter(p => p.role === UserRole.ADMIN).length,
      moderators: participants.filter(p => p.role === UserRole.MODERATOR).length,
      users: participants.filter(p => p.role === UserRole.USER).length,
      observers: participants.filter(p => p.role === UserRole.OBSERVER).length
    };
  }

  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

