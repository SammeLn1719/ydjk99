import express, { Application } from "express";
import cors from "cors";
import pool from "./config/database";

const authRouter = require('./routers/authRouter');
const app: Application = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/auth", authRouter);

app.get('/', (req, res) => {
    res.json({ message: 'Backend API is running!' });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Backend API'
    });
});
app.get('/api/user/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.json(result.rows)

    }catch(error){
        console.error('Database error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});


app.get('/api/messages', (req, res) => {
    const messages = [
        { id: 1, text: 'Hello from backend!', timestamp: new Date().toISOString() },
        { id: 2, text: 'This is a test message', timestamp: new Date().toISOString() }
    ];
    res.json(messages);
});

app.listen(PORT, () => {
    try {
    console.log(`Server is running on port ${PORT}`);
    } catch (error) {
        console.error('Error starting server:', error);
    }
});