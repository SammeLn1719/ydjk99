# Messager App

Полноценное веб-приложение с React + TypeScript фронтендом и Node.js + Express бэкендом, запускаемое через Docker контейнеры.


# Разработка 
docker exec -it postgres_db psql -U postgres -d your_app_name - Для подключения к db

```
curl -X POST http://localhost:8001/ \
  -H "Content-Type: application/json" \
  -d '{
    "....": "....",
    "....": "....",
    "....": "...."
  }'

``` - curl для запросов из cmd

```
docker-compose down
docker-compose up --build
``` - запуск контейнера


## Структура проекта

```
messager/
├── frontend/          # React + TypeScript приложение
├── backend/           # Node.js + Express API
├── docker-compose.yml # Docker Compose конфигурация
└── README.md
```

## Технологии

### Frontend
- React 18
- TypeScript
- CSS3 с современным дизайном
- Nginx для production

### Backend
- Node.js 18
- Express.js
- TypeScript
- CORS поддержка

### DevOps
- Docker
- Docker Compose
- Nginx reverse proxy

## Быстрый запуск

### 1. Запуск через Docker Compose (рекомендуется)

```bash
# Собрать и запустить все сервисы
docker-compose up --build

# Запуск в фоновом режиме
docker-compose up -d --build
```

После запуска приложение будет доступно по адресам:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001

### 2. Остановка

```bash
# Остановить все сервисы
docker-compose down

# Остановить и удалить volumes
docker-compose down -v
```

## Разработка

### Frontend (локальная разработка)

```bash
cd frontend
npm install
npm start
```

Frontend будет доступен на http://localhost:3000

### Backend (локальная разработка)

```bash
cd backend
npm install
npm run dev
```

Backend будет доступен на http://localhost:3001

## API Endpoints

### Health Check
- `GET /api/health` - Проверка состояния сервера

### Messages
- `GET /api/messages` - Получение списка сообщений

## Docker команды

### Сборка отдельных сервисов

```bash
# Сборка frontend
docker build -t messager-frontend ./frontend

# Сборка backend
docker build -t messager-backend ./backend
```

### Запуск отдельных контейнеров

```bash
# Frontend
docker run -p 80:80 messager-frontend

# Backend
docker run -p 3001:3001 messager-backend
```

## Структура файлов

### Frontend
- `src/App.tsx` - Основной компонент приложения
- `src/App.css` - Стили приложения
- `Dockerfile` - Docker конфигурация
- `nginx.conf` - Nginx конфигурация

### Backend
- `src/index.ts` - Основной файл сервера
- `tsconfig.json` - TypeScript конфигурация
- `nodemon.json` - Конфигурация для разработки
- `Dockerfile` - Docker конфигурация

## Возможные проблемы

### Порт 80 занят
Если порт 80 занят, измените порт в `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "8080:80"  # Изменить на 8080
```

### Порт 3001 занят
Если порт 3001 занят, измените порт в `docker-compose.yml`:

```yaml
backend:
  ports:
    - "3002:3001"  # Изменить на 3002
```

## Логи

```bash
# Просмотр логов всех сервисов
docker-compose logs

# Просмотр логов конкретного сервиса
docker-compose logs frontend
docker-compose logs backend

# Логи в реальном времени
docker-compose logs -f
```
