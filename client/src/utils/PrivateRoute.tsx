// PrivateRoute.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from './axiosInstance';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Verify if the user is authenticated by calling the check-auth endpoint
                await axiosInstance.get('/auth/check-auth');
                setIsAuthenticated(true); // User is authenticated
            } catch (error) {
                console.error("Access denied: You are not logged in", error);
                setIsAuthenticated(false); // User is not authenticated
                navigate('/login'); // Redirect to login page
            }
        };

        checkAuth();
    }, [navigate]);

    // Optionally, you can show a loading indicator while checking authentication
    if (isAuthenticated === null) return <div>Loading...</div>;

    return isAuthenticated ? <>{children}</> : null;
};

export default PrivateRoute;
