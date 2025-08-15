import express, { Application } from "express";
import cors from "cors";
import { createServer } from "http";
import { initDatabase } from "./config/database";
import WebSocketServer from "./websocket/websocketServer";

const authRouter = require('./routers/authRouter');
const app: Application = express();
const server = createServer(app);
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/auth", authRouter);

// Инициализация WebSocket сервера
const wsServer = new WebSocketServer(server);

server.listen(PORT, async () => {
    console.log("Actual DATABASE_URL:", process.env.DATABASE_URL);
    try {
        await initDatabase();
        console.log(`Server is running on port ${PORT}`);
        console.log(`WebSocket server is ready`);
    } catch (error) {
        console.error('Error starting server:', error);
    }
});