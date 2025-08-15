import express, { Application } from "express";
import cors from "cors";
import { initDatabase } from "./config/database";

const authRouter = require('./routers/authRouter');
const app: Application = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/auth", authRouter);

app.listen(PORT, async () => {
    console.log("Actual DATABASE_URL:", process.env.DATABASE_URL);
    try {
        await initDatabase();
        console.log(`Server is running on port ${PORT}`);
    } catch (error) {
        console.error('Error starting server:', error);
    }
});