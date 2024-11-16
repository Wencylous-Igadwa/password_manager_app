import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Register from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgetPasswordPage';
import Dashboard from './pages/DashboardPage';
import PrivateRoute from './utils/PrivateRoute';

const App: React.FC = () => {
    const username = "sampleUser"; 
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // Fallback for missing clientId
    if (!googleClientId) {
        console.error("Google client ID is not set. Please check your .env file.");
        return <div>Error: Google client ID is missing.</div>;
    }

    return (
        <GoogleOAuthProvider clientId={googleClientId}> {/* Wrap the app with GoogleOAuthProvider */}
            <Router>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot_password" element={<ForgotPasswordPage />} />
                    
                    {/* Wrap Dashboard route with PrivateRoute */}
                    <Route 
                        path="/dashboard" 
                        element={
                            <PrivateRoute>
                                <Dashboard 
                                    username={username} 
                                    onLogout={() => { 
                                        console.log("Logout successful"); 
                                    }} 
                                />
                            </PrivateRoute>
                        } 
                    />
                </Routes>
            </Router>
        </GoogleOAuthProvider>
    );
};

export default App;
