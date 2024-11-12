import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Register from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgetPasswordPage';
import Dashboard from './pages/DashboardPage';
import PrivateRoute from './utils/PrivateRoute';

const App: React.FC = () => {
    const username = "sampleUser"; 

    return (
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
    );
};

export default App;
