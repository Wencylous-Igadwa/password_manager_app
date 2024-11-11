// src/pages/LandingPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    const handleSignUp = () => {
        navigate('/login'); // Navigate to the login page
    };

    return (
        <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#f0f0f0' }}>
            <h1>Welcome to Our Password Manager Application!</h1>
            <p>Securely manage your passwords with ease.</p>
            <button onClick={handleSignUp}>Sign Up</button>
        </div>
    );
};

export default LandingPage;
