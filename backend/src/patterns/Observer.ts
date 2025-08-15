export interface Observer {
  update(event: string, data: any): void;
  getObserverId(): string; // Уникальный идентификатор наблюдателя
}

export interface Subject {
  attach(observer: Observer): void;
  detach(observer: Observer): void;
  notify(event: string, data: any): void;
}

export class EventSubject implements Subject {
  private observers: Map<string, Observer[]> = new Map();

  attach(observer: Observer, event?: string): void {
    const eventKey = event || 'default';
    if (!this.observers.has(eventKey)) {
      this.observers.set(eventKey, []);
    }
    this.observers.get(eventKey)!.push(observer);
  }

  detach(observer: Observer, event?: string): void {
    const eventKey = event || 'default';
    if (this.observers.has(eventKey)) {
      const observers = this.observers.get(eventKey)!;
      const index = observers.indexOf(observer);
      if (index > -1) {
        observers.splice(index, 1);
      }
    }
  }

  notify(event: string, data: any): void {
    // Уведомляем наблюдателей конкретного события
    if (this.observers.has(event)) {
      this.observers.get(event)!.forEach(observer => {
        observer.update(event, data);
      });
    }

    // Уведомляем наблюдателей по умолчанию
    if (this.observers.has('default')) {
      this.observers.get('default')!.forEach(observer => {
        observer.update(event, data);
      });
    }
  }

  getObserverCount(event?: string): number {
    const eventKey = event || 'default';
    return this.observers.get(eventKey)?.length || 0;
  }
}

// Конкретные наблюдатели
export class LoggingObserver implements Observer {
  private id: string;

  constructor(id?: string) {
    this.id = id || `logging_${Date.now()}`;
  }

  update(event: string, data: any): void {
    console.log(`[${new Date().toISOString()}] [${this.id}] Event: ${event}`, data);
  }

  getObserverId(): string {
    return this.id;
  }
}

export class MetricsObserver implements Observer {
  private id: string;
  private metrics: Map<string, number> = new Map();

  constructor(id?: string) {
    this.id = id || `metrics_${Date.now()}`;
  }

  update(event: string, data: any): void {
    const currentCount = this.metrics.get(event) || 0;
    this.metrics.set(event, currentCount + 1);
  }

  getObserverId(): string {
    return this.id;
  }

  getMetrics(): Map<string, number> {
    return new Map(this.metrics);
  }

  resetMetrics(): void {
    this.metrics.clear();
  }
}

// Наблюдатель для уведомлений
export class NotificationObserver implements Observer {
  private id: string;
  private notifications: Array<{event: string, data: any, timestamp: string}> = [];

  constructor(id?: string) {
    this.id = id || `notification_${Date.now()}`;
  }

  update(event: string, data: any): void {
    const notification = {
      event,
      data,
      timestamp: new Date().toISOString()
    };
    
    this.notifications.push(notification);
    
    // Логируем важные события
    if (event.includes('error') || event.includes('warning')) {
      console.warn(`[${this.id}] Important event: ${event}`, data);
    }
  }

  getObserverId(): string {
    return this.id;
  }

  getNotifications(): Array<{event: string, data: any, timestamp: string}> {
    return [...this.notifications];
  }

  clearNotifications(): void {
    this.notifications = [];
  }
}

// Наблюдатель для аналитики
export class AnalyticsObserver implements Observer {
  private id: string;
  private analytics: Map<string, {
    count: number;
    lastOccurrence: string;
    data: any[];
  }> = new Map();

  constructor(id?: string) {
    this.id = id || `analytics_${Date.now()}`;
  }

  update(event: string, data: any): void {
    if (!this.analytics.has(event)) {
      this.analytics.set(event, {
        count: 0,
        lastOccurrence: '',
        data: []
      });
    }

    const eventData = this.analytics.get(event)!;
    eventData.count++;
    eventData.lastOccurrence = new Date().toISOString();
    eventData.data.push(data);
  }

  getObserverId(): string {
    return this.id;
  }

  getAnalytics(): Map<string, {count: number, lastOccurrence: string, data: any[]}> {
    return new Map(this.analytics);
  }

  getEventCount(event: string): number {
    return this.analytics.get(event)?.count || 0;
  }
}
