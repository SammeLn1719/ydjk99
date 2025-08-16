import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AuthContainer from './components/AuthContainer';
import Dashboard from './components/Dashboard';
import NotFound from './components/NotFound';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';

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
  const { isAuthenticated, isLoading } = useAuth();

  console.log('App render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

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
    <Router>
      {isLoading ? (
        <div>Загрузка...</div>
      ) : (
        <Routes>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <AuthContainer />} 
          />

          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/" element={<Navigate to="/login" />} />
  
          <Route path="*" element={<NotFound />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
