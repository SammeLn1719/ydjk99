import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRoles?: string[];
}

 
export const ProtectedRoute = ({ children, requiredRoles = [] }: ProtectedRouteProps) => {
    const location = useLocation();
    const token = localStorage.getItem('authToken');
    
    console.log('ProtectedRoute - token:', token, 'location:', location.pathname);
    
    if (!token) {
        console.log('ProtectedRoute - no token, redirecting to login');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    if (requiredRoles.length > 0) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userRoles = payload.roles || [];
            const hasRole = requiredRoles.some(role => userRoles.includes(role));
            
            if (!hasRole) {
                return <Navigate to="/unauthorized" replace />;
            }
        } catch (error) {
            localStorage.removeItem('authToken');
            return <Navigate to="/login" replace />;
        }
    }
    
    return <>{children}</>;
};