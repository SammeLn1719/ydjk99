import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!true);
    }, []);

    if(isAuthenticated === null) {
        return <div>Loading...</div>
    }

    if(!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return <>children</>;
}

export default ProtectedRoute;