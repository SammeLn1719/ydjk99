FROM node:18-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем TypeScript
RUN npm run build

# Устанавливаем pg
RUN npm install pg

# Открываем порт
EXPOSE 8001

# Запускаем приложение
CMD ["npm", "start"]