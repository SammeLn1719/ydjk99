import React, { useState, useEffect } from 'react';
import './App.css';

interface Message {
  id: number;
  text: string;
  timestamp: string;
}

interface HealthStatus {
  status: string;
  timestamp: string;
  service: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Error fetching health status:', error);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchMessages();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Messager App</h1>
        <p>React + TypeScript Frontend with Node.js + Express Backend</p>
      </header>

      <main className="App-main">
        <section className="health-section">
          <h2>Backend Health Status</h2>
          {health ? (
            <div className="health-info">
              <p><strong>Status:</strong> {health.status}</p>
              <p><strong>Service:</strong> {health.service}</p>
              <p><strong>Timestamp:</strong> {new Date(health.timestamp).toLocaleString()}</p>
            </div>
          ) : (
            <p>Loading health status...</p>
          )}
        </section>

        <section className="messages-section">
          <h2>Messages from Backend</h2>
          <button onClick={fetchMessages} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh Messages'}
          </button>
          
          <div className="messages-list">
            {messages.map((message) => (
              <div key={message.id} className="message">
                <p className="message-text">{message.text}</p>
                <small className="message-timestamp">
                  {new Date(message.timestamp).toLocaleString()}
                </small>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
