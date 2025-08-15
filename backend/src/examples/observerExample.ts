import { EventSubject, LoggingObserver, MetricsObserver, NotificationObserver, AnalyticsObserver } from '../patterns/Observer';

// Пример использования Observer Pattern
export class ChatEventManager {
  private eventSubject: EventSubject;
  private observers: Map<string, any> = new Map();

  constructor() {
    this.eventSubject = new EventSubject();
    this.setupObservers();
  }

  private setupObservers(): void {
    // Создаем различных наблюдателей
    const logger = new LoggingObserver('chat_logger');
    const metrics = new MetricsObserver('chat_metrics');
    const notifications = new NotificationObserver('chat_notifications');
    const analytics = new AnalyticsObserver('chat_analytics');

    // Сохраняем ссылки для доступа к методам
    this.observers.set('logger', logger);
    this.observers.set('metrics', metrics);
    this.observers.set('notifications', notifications);
    this.observers.set('analytics', analytics);

    // Подключаем наблюдателей к конкретным событиям
    this.eventSubject.attach(logger, 'message_sent');
    this.eventSubject.attach(logger, 'user_joined');
    this.eventSubject.attach(logger, 'user_left');
    this.eventSubject.attach(logger, 'error');

    this.eventSubject.attach(metrics, 'message_sent');
    this.eventSubject.attach(metrics, 'user_joined');
    this.eventSubject.attach(metrics, 'user_left');

    this.eventSubject.attach(notifications, 'error');
    this.eventSubject.attach(notifications, 'warning');
    this.eventSubject.attach(notifications, 'user_joined');

    this.eventSubject.attach(analytics, 'message_sent');
    this.eventSubject.attach(analytics, 'user_activity');
  }

  // Методы для генерации событий
  sendMessage(userId: string, message: string): void {
    this.eventSubject.notify('message_sent', {
      userId,
      message,
      timestamp: new Date().toISOString()
    });
  }

  userJoined(userId: string, roomId: string): void {
    this.eventSubject.notify('user_joined', {
      userId,
      roomId,
      timestamp: new Date().toISOString()
    });
  }

  userLeft(userId: string, roomId: string): void {
    this.eventSubject.notify('user_left', {
      userId,
      roomId,
      timestamp: new Date().toISOString()
    });
  }

  reportError(error: string, context: any): void {
    this.eventSubject.notify('error', {
      error,
      context,
      timestamp: new Date().toISOString()
    });
  }

  userActivity(userId: string, activity: string): void {
    this.eventSubject.notify('user_activity', {
      userId,
      activity,
      timestamp: new Date().toISOString()
    });
  }

  // Методы для получения данных от наблюдателей
  getMetrics(): Map<string, number> {
    const metrics = this.observers.get('metrics') as MetricsObserver;
    return metrics.getMetrics();
  }

  getNotifications(): Array<{event: string, data: any, timestamp: string}> {
    const notifications = this.observers.get('notifications') as NotificationObserver;
    return notifications.getNotifications();
  }

  getAnalytics(): Map<string, {count: number, lastOccurrence: string, data: any[]}> {
    const analytics = this.observers.get('analytics') as AnalyticsObserver;
    return analytics.getAnalytics();
  }

  getEventCount(event: string): number {
    const analytics = this.observers.get('analytics') as AnalyticsObserver;
    return analytics.getEventCount(event);
  }

  // Методы для управления наблюдателями
  addObserver(observer: any, event?: string): void {
    this.eventSubject.attach(observer, event);
  }

  removeObserver(observerId: string): void {
    // Находим наблюдателя по ID и отключаем его
    for (const [key, observer] of this.observers.entries()) {
      if (observer.getObserverId() === observerId) {
        this.eventSubject.detach(observer);
        this.observers.delete(key);
        break;
      }
    }
  }

  getObserverCount(event?: string): number {
    return this.eventSubject.getObserverCount(event);
  }
}

// Пример использования
export function demonstrateObserverPattern(): void {
  console.log('=== Демонстрация Observer Pattern ===\n');

  const chatManager = new ChatEventManager();

  // Генерируем события
  chatManager.sendMessage('user1', 'Привет всем!');
  chatManager.userJoined('user2', 'room1');
  chatManager.sendMessage('user2', 'Привет!');
  chatManager.userActivity('user1', 'typing');
  chatManager.userLeft('user1', 'room1');
  chatManager.reportError('Connection lost', { userId: 'user3' });

  // Получаем данные от наблюдателей
  console.log('📊 Метрики:');
  const metrics = chatManager.getMetrics();
  metrics.forEach((count, event) => {
    console.log(`  ${event}: ${count}`);
  });

  console.log('\n🔔 Уведомления:');
  const notifications = chatManager.getNotifications();
  notifications.forEach(notification => {
    console.log(`  [${notification.timestamp}] ${notification.event}:`, notification.data);
  });

  console.log('\n📈 Аналитика:');
  const analytics = chatManager.getAnalytics();
  analytics.forEach((data, event) => {
    console.log(`  ${event}: ${data.count} раз, последний: ${data.lastOccurrence}`);
  });

  console.log('\n👥 Статистика наблюдателей:');
  console.log(`  Всего наблюдателей: ${chatManager.getObserverCount()}`);
  console.log(`  Наблюдателей событий message_sent: ${chatManager.getObserverCount('message_sent')}`);
  console.log(`  Наблюдателей событий error: ${chatManager.getObserverCount('error')}`);

  console.log('\n=== Конец демонстрации ===\n');
}
