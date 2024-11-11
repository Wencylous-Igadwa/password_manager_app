// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Register from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgetPasswordPage';
import Dashboard from './pages/DashboardPage';



const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot_password" element={<ForgotPasswordPage />} />
                <Route path="/dashboard" element={<Dashboard username={''} onLogout={function (): void {
                    throw new Error('Function not implemented.');
                } } />} />
                
            </Routes>
        </Router>
    );
};

export default App;
