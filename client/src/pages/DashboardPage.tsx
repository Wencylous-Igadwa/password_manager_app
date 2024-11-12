// src/Dashboard.tsx
import React, { useState } from 'react';
import './Dashboard.css';
import { FaEye, FaEyeSlash, FaClipboard } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axiosInstance from "../utils/axiosInstance";

interface Props {
    username: string;
    onLogout: () => void;
}

const Dashboard: React.FC<Props> = ({ username, onLogout }) => {
    const [passwords, setPasswords] = useState<{ url: string; username: string; password: string }[]>([]);
    const [recentActivities, setRecentActivities] = useState<string[]>([]);
    const [newUrl, setNewUrl] = useState<string>('');
    const [newUsername, setNewUsername] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [selectedContent, setSelectedContent] = useState<'addPassword' | 'recentActivities' | 'availablePasswords' | null>(null);
    const [passwordStrength, setPasswordStrength] = useState<{ score: number; text: string } | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState<{ [index: number]: boolean }>({});
    const navigate = useNavigate();

    // Dark/Light mode
    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        document.body.classList.toggle('dark-mode', !isDarkMode);
    };

    // Function to copy username and password to clipboard
    const copyCredentialsToClipboard = (username: string, password: string) => {
        const textToCopy = `Username: ${username}\nPassword: ${password}`;
        navigator.clipboard.writeText(textToCopy)
            .then(() => alert("Username and Password copied to clipboard!"))
            .catch((err) => console.error("Failed to copy text: ", err));
    };

    // Password visibility
    const togglePasswordVisibility = (index: number) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    // Function to generate a random password
    const generatePassword = () => {
        const length = 12;
        const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowercase = "abcdefghijklmnopqrstuvwxyz";
        const numbers = "0123456789";
        const specialChars = "!@#$%^&*()_+[]{}|;:,.<>?";

        const allChars = uppercase + lowercase + numbers + specialChars;

        let password = [
            uppercase[Math.floor(Math.random() * uppercase.length)],
            lowercase[Math.floor(Math.random() * lowercase.length)],
            numbers[Math.floor(Math.random() * numbers.length)],
            specialChars[Math.floor(Math.random() * specialChars.length)]
        ];

        for (let i = password.length; i < length; i++) {
            password.push(allChars[Math.floor(Math.random() * allChars.length)]);
        }

        password = password.sort(() => Math.random() - 0.5);
        setNewPassword(password.join(''));
    };

    // Function to add a new password
    const addPassword = () => {
        if (newUrl && newUsername && newPassword) {
            const newEntry = { url: newUrl, username: newUsername, password: newPassword };
            setPasswords([...passwords, newEntry]);
            setRecentActivities([...recentActivities, `Added password for ${newUsername} at ${newUrl}`]);
            setNewUrl('');
            setNewUsername('');
            setNewPassword('');
        }
    };

    // Password strength analyzer
    const analyzePasswordStrength = (password: string) => {
        let score = 0;
        let text = 'Weak';

        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        switch (score) {
            case 1:
            case 2:
                text = 'Weak';
                break;
            case 3:
                text = 'Moderate';
                break;
            case 4:
                text = 'Strong';
                break;
            case 5:
                text = 'Very Strong';
                break;
        }

        setPasswordStrength({ score, text });
    };

    // Handle click on a password row to analyze its strength
    const handlePasswordClick = (password: string) => {
        analyzePasswordStrength(password);
        setSelectedContent('availablePasswords');
    };

    // Handle content selection
    const handleContentSelect = (content: 'addPassword' | 'recentActivities' | 'availablePasswords') => {
        setSelectedContent(content);
    };

    const handleLogout = async () => {
        try {
            await axiosInstance.post('/auth/logout');  // Server clears the token cookie
    
            // Clear remaining tokens and session data on the client side
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            localStorage.removeItem('csrfToken');
            document.cookie = 'csrfToken=; Max-Age=0; path=/;';  // Remove csrfToken cookie
    
            // Call onLogout callback if provided
            if (typeof onLogout === 'function') {
                onLogout();
            }
            
            // Redirect to login page
            setTimeout(() => {
                navigate('/login');  // Redirect to login page after 5 seconds
            }, 3000);
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    return (
        <div className={`dashboard ${isDarkMode ? 'dark' : 'light'}`}>
            <nav className="navbar">
                <div className="menu-button" onClick={() => setMenuOpen(!menuOpen)}>
                    ☰
                </div>
                <div className="navbar-brand">Password Manager</div>
                <div className="navbar-links">
                    <button onClick={handleLogout}>Logout</button>
                </div>

                {menuOpen && (
                    <div className="dropdown-menu">
                        <p><strong>Account:</strong> {username}</p>
                        <button onClick={toggleTheme}>
                            {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        </button>
                    </div>
                )}
            </nav>
            <h1>Welcome, {username}</h1>
            <div className="container">
                <div className="sidebar">
                    <h2>Menu</h2>
                    <button className="menu-button" onClick={() => handleContentSelect('addPassword')}>Add Password</button>
                    <button className="menu-button" onClick={() => handleContentSelect('recentActivities')}>Recent Activities</button>
                    <button className="menu-button" onClick={() => handleContentSelect('availablePasswords')}>Available Passwords</button>
                </div>
                <div className="content">
                {selectedContent === 'addPassword' && (
                    <div>
                        <h2>Add Password</h2>
                        <div className="form-group">
                            <input
                                type="text"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                placeholder="Enter site URL"
                            />
                            <input
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                placeholder="Enter username"
                            />
                             <div className="password-input-group">
                                    <input
                                        type="text"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)} // Allow user input
                                        placeholder="Enter or generate password"
                                    />
                                    <button className="generate-button" onClick={generatePassword}>
                                        Generate Password
                                    </button>
                                </div>
                                <button className="add-button" onClick={addPassword}>Add New Password</button>
                            </div>
                        </div>
                    )}
                {selectedContent === 'recentActivities' && (
                    <div>
                        <h2>Recent Activities</h2>
                        <ul>
                            {recentActivities.map((activity, index) => (
                                <li key={index}>{activity}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {selectedContent === 'availablePasswords' && (
                    <div>
                        <h2>Available Passwords</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>URL</th>
                                    <th>Username</th>
                                    <th>Password</th>
                                </tr>
                            </thead>
                            <tbody>
                                {passwords.map((entry, index) => (
                                    <tr key={index} onClick={() => handlePasswordClick(entry.password)}>
                                        <td>{entry.url}</td>
                                        <td>{entry.username}</td>
                                        <td><span className="password-field">
                                                    {/* Show password text or masked based on visibility state */}
                                                    {visiblePasswords[index] ? entry.password : '•'.repeat(entry.password.length)}
                                                    <button
                                                        onClick={() => togglePasswordVisibility(index)}
                                                        className="toggle-password-btn"
                                                    >
                                                        {/* Toggle eye icon based on visibility */}
                                                        {visiblePasswords[index] ? <FaEyeSlash /> : <FaEye />}
                                                    </button>
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => copyCredentialsToClipboard(entry.username, entry.password)}
                                                    className="copy-button"
                                                >
                                                    <FaClipboard /> Copy
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>

                        {/* Password strength display only appears in availablePasswords section */}
                        {passwordStrength && (
                            <div className="password-strength">
                                <h3>Password Strength</h3>
                                <p>Score: {passwordStrength.score}/5</p>
                                <p>Strength: {passwordStrength.text}</p>
                                <div className="strength-bar">
                                    <div
                                        className={`strength-level strength-${passwordStrength.text.toLowerCase()}`}
                                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {selectedContent === null && <p className="no-option-message">Select an option from the menu.</p>}
            </div>
            </div>
        </div>
    );
};

export default Dashboard;
