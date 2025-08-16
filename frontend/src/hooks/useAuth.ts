// hooks/useAuth.ts
import { useState, useEffect } from 'react';

interface User {
    id: string;
    username: string;
    roles: string[];
}

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser(payload);
            } catch (error) {
                localStorage.removeItem('authToken');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (token: string) => {
        console.log('useAuth login called with token:', token);
        localStorage.setItem('authToken', token);
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('Token payload:', payload);
            setUser(payload);
        } catch (error) {
            console.error('Error parsing token:', error);
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setUser(null);
    };

    const hasRole = (role: string) => {
        return user?.roles.includes(role) || false;
    };

    return { user, isAuthenticated: !!user, isLoading, login, logout, hasRole };
};