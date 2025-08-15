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

export interface TypingEvent {
  userId: string;
  userName: string;
  chatId: string;
  isTyping: boolean;
}

export interface Contact {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
}

export interface Chat {
  id: string;
  name: string;
  type: 'private' | 'group' | 'public' | 'announcement';
  participants: string[];
  moderators: string[];
  admins: string[];
  observers: string[];
  lastMessage?: ChatMessage;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  maxParticipants?: number;
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
