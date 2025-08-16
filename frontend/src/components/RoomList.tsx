import React, { useState, useEffect, useMemo } from 'react';
import { websocketService, Room, RoomType, UserRole } from '../services/websocketService';
import './RoomList.css';

interface RoomListProps {
  onRoomSelect?: (room: Room) => void;
  selectedRoomId?: string;
}

const RoomList: React.FC<RoomListProps> = ({ onRoomSelect, selectedRoomId }) => {
  const [rooms, setRooms] = useState<{ public: Room[]; user: Room[] }>({ public: [], user: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'public' | 'user'>('public');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const pageSize = 10;

  // Загружаем комнаты при монтировании
  useEffect(() => {
    websocketService.getRooms();

    const unsubscribe = websocketService.onRoomEvent((event, data) => {
      switch (event) {
        case 'roomsList':
          setRooms(data);
          break;
        case 'userJoinedRoom':
          // Обновляем список комнат пользователя
          websocketService.getRooms();
          break;
        case 'userLeftRoom':
          // Обновляем список комнат пользователя
          websocketService.getRooms();
          break;
      }
    });

    return unsubscribe;
  }, []);

  // Фильтруем комнаты по поиску
  const filteredRooms = useMemo(() => {
    const roomList = activeTab === 'public' ? rooms.public : rooms.user;
    
    if (!searchQuery.trim()) {
      return roomList;
    }

    return roomList.filter(room =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rooms, activeTab, searchQuery]);

  // Виртуальный список - показываем только текущую страницу
  const paginatedRooms = useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    const result = filteredRooms.slice(start, end);
    
    setHasMore(end < filteredRooms.length);
    
    return result;
  }, [filteredRooms, currentPage, pageSize]);

  const handleRoomClick = (room: Room) => {
    onRoomSelect?.(room);
  };

  const handleJoinRoom = (room: Room) => {
    websocketService.joinRoom(room.id, UserRole.USER);
  };

  const handleLeaveRoom = (room: Room) => {
    websocketService.leaveRoom(room.id);
  };

  const loadMore = () => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const getRoomTypeIcon = (type: RoomType) => {
    switch (type) {
      case RoomType.PUBLIC:
        return '🌐';
      case RoomType.PRIVATE:
        return '🔒';
      case RoomType.RESTRICTED:
        return '🛡️';
      case RoomType.ANNOUNCEMENT:
        return '📢';
      default:
        return '💬';
    }
  };

  const getRoomTypeLabel = (type: RoomType) => {
    switch (type) {
      case RoomType.PUBLIC:
        return 'Публичная';
      case RoomType.PRIVATE:
        return 'Приватная';
      case RoomType.RESTRICTED:
        return 'Ограниченная';
      case RoomType.ANNOUNCEMENT:
        return 'Объявления';
      default:
        return 'Чат';
    }
  };

  const isUserInRoom = (room: Room) => {
    return rooms.user.some(userRoom => userRoom.id === room.id);
  };

  return (
    <div className="room-list">
      <div className="room-list-header">
        <h3>Комнаты</h3>
        <div className="room-tabs">
          <button
            className={`tab ${activeTab === 'public' ? 'active' : ''}`}
            onClick={() => setActiveTab('public')}
          >
            Публичные ({rooms.public.length})
          </button>
          <button
            className={`tab ${activeTab === 'user' ? 'active' : ''}`}
            onClick={() => setActiveTab('user')}
          >
            Мои ({rooms.user.length})
          </button>
        </div>
      </div>

      <div className="room-search">
        <input
          type="text"
          placeholder="Поиск комнат..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="rooms-container">
        {paginatedRooms.length === 0 ? (
          <div className="no-rooms">
            <p>Комнаты не найдены</p>
          </div>
        ) : (
          <>
            {paginatedRooms.map((room) => (
              <div
                key={room.id}
                className={`room-item ${selectedRoomId === room.id ? 'selected' : ''}`}
                onClick={() => handleRoomClick(room)}
              >
                <div className="room-icon">
                  {getRoomTypeIcon(room.type)}
                </div>
                
                <div className="room-info">
                  <div className="room-header">
                    <h4 className="room-name">{room.name}</h4>
                    <span className="room-type">{getRoomTypeLabel(room.type)}</span>
                  </div>
                  
                  {room.description && (
                    <p className="room-description">{room.description}</p>
                  )}
                  
                  <div className="room-stats">
                    <span className="participants">
                      👥 {room.participants.length}/{room.maxParticipants}
                    </span>
                    {room.isActive && <span className="status active">Активна</span>}
                  </div>
                </div>

                <div className="room-actions">
                  {isUserInRoom(room) ? (
                    <button
                      className="leave-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeaveRoom(room);
                      }}
                    >
                      Покинуть
                    </button>
                  ) : (
                    <button
                      className="join-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinRoom(room);
                      }}
                    >
                      Присоединиться
                    </button>
                  )}
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="load-more">
                <button onClick={loadMore} className="load-more-btn">
                  Загрузить еще
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RoomList;

