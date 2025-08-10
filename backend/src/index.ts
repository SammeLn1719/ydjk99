import express, { Application } from "express";
import cors from "cors";

const app: Application = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

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

app.get('/api/messages', (req, res) => {
    const messages = [
        { id: 1, text: 'Hello from backend!', timestamp: new Date().toISOString() },
        { id: 2, text: 'This is a test message', timestamp: new Date().toISOString() }
    ];
    res.json(messages);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});