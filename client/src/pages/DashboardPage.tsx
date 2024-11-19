import React, { useState } from 'react';
import './Dashboard.css';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash ,FaClipboard, FaEdit, FaTrash, FaSave } from 'react-icons/fa';
import dash1 from '/src/assets/images/dash1.png';
import axiosInstance from "../utils/axiosInstance";

interface Props {
    username: string;
    onLogout: () => void;
}

 // Define the structure of a single password entry
 interface PasswordEntry {
    url: string;
    username: string;
    password: string;
}

const Dashboard: React.FC<Props> = ({ username, onLogout }) => {
    const navigate = useNavigate(); // Initialize navigate hook
    const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
    const [editIndex, setEditIndex] = useState<number | null>(null); // Track index of edited entry
    const [editedEntry, setEditedEntry] = useState<PasswordEntry | null>(null); // Hold edited entry data
    const [recentActivities, setRecentActivities] = useState<string[]>([]);
    const [newUrl, setNewUrl] = useState<string>('');
    const [newUsername, setNewUsername] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [selectedContent, setSelectedContent] = useState<'addPassword' | 'recentActivities' | 'availablePasswords' | null>(null);
    const [passwordStrength, setPasswordStrength] = useState<{ score: number; text: string } | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);  // State to control menu dropdown visibility
    const [isDarkMode, setIsDarkMode] = useState(false);  // State for dark/light mode
    const [visiblePasswords, setVisiblePasswords] = useState<{ [index: number]: boolean }>({});
  
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

    const handleEdit = (index: number) => {
        setEditIndex(index);
        setEditedEntry({ ...passwords[index] }); // Set the entry's data into editedEntry state
    };

    // Save changes after editing
    const saveEdit = (index: number) => {
        if (editedEntry) {
            const updatedPasswords = [...passwords];
            updatedPasswords[index] = editedEntry;
            setPasswords(updatedPasswords);
            setEditIndex(null);
            setEditedEntry(null);
            // Optionally, save the updated password to the database
            updatePasswordInDatabase(editedEntry);
        }
    };

    const cancelEdit = () => {
        setEditIndex(null);
        setEditedEntry(null);
    };

    const handleEditedFieldChange = (field: keyof PasswordEntry, value: string) => {
        if (editedEntry) {
            setEditedEntry({ ...editedEntry, [field]: value });
        }
    };
     
    const deletePassword = (index: number) => {
        const updatedPasswords = passwords.filter((_, i) => i !== index);
        setPasswords(updatedPasswords);
        // Optionally, remove the password from the database
        deletePasswordFromDatabase(passwords[index]);
    };

    // Update password in the database
    const updatePasswordInDatabase = async (passwordEntry: PasswordEntry) => {
        try {
            await fetch('/api/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passwordEntry),
            });
        } catch (error) {
            console.error('Failed to update password:', error);
        }
    };

    // Delete password from the database
    const deletePasswordFromDatabase = async (passwordEntry: PasswordEntry) => {
        try {
            await fetch('/api/delete-password', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passwordEntry),
            });
        } catch (error) {
            console.error('Failed to delete password:', error);
        }
    };

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
     
    // Password visibiity
    const togglePasswordVisibility = (index: number) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    // Handle CSV import
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                complete: (result: { data: Record<string, string>[] }) => {
                    const importedPasswords: PasswordEntry[] = result.data.map((entry: Record<string, string>) => ({
                        url: entry.url || '',
                        username: entry.username || '',
                        password: entry.password || '',
                    }));
                    setPasswords([...passwords, ...importedPasswords]);
                    setRecentActivities([...recentActivities, `Imported ${importedPasswords.length} passwords from CSV`]);

                    // Store imported passwords in the database
                    savePasswordsToDatabase(importedPasswords);
                },
                error: (error: Error) => {
                    console.error('Error reading CSV file:', error.message);
                    alert('Failed to import passwords. Check the file format.');
                },
            });
        }
    };


    // Function to save passwords to the database
    const savePasswordsToDatabase = async (passwordEntries: PasswordEntry[]) => {
        try {
            const response = await fetch('/api/save-passwords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passwords: passwordEntries }),
            });
            if (!response.ok) {
                console.error('Failed to save passwords to the database');
            }
        } catch (error) {
            console.error('Error saving to database:', error);
        }
    };

    const exportPasswordsToCSV = async () => {
        try {
            // Fetch passwords from the database if needed
            const response = await fetch('/api/get-passwords');
            if (!response.ok) {
                console.error('Failed to fetch passwords for export');
                return;
            }
            
            const passwordsToExport: PasswordEntry[] = await response.json();
            
            // Convert password data to CSV format
            const csvData = Papa.unparse(passwordsToExport);
            
            // Create a Blob from the CSV data
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            // Create a link to download the CSV file
            const link = document.createElement('a');
            link.href = url;
            link.download = 'passwords_export.csv';
            
            // Programmatically click the link to trigger download
            link.click();
            
            // Cleanup URL object
            URL.revokeObjectURL(url);
            
            // Log recent activity
            setRecentActivities([...recentActivities, 'Exported passwords to CSV']);
        } catch (error) {
            console.error('Error exporting passwords:', error);
        }
    };

    // Function to generate a random password
    const generatePassword = () => {
        const length = 12;
        const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowercase = "abcdefghijklmnopqrstuvwxyz";
        const numbers = "0123456789";
        const specialChars = "!@#$%^&*()_+[]{}|;:,.<>?";
        
        const allChars = uppercase + lowercase + numbers + specialChars;
    
        // Ensure the password contains at least one of each required character type
        let password = [
            uppercase[Math.floor(Math.random() * uppercase.length)],
            lowercase[Math.floor(Math.random() * lowercase.length)],
            numbers[Math.floor(Math.random() * numbers.length)],
            specialChars[Math.floor(Math.random() * specialChars.length)]
        ];
    
        // Fill the rest of the password length with random characters from allChars
        for (let i = password.length; i < length; i++) {
            password.push(allChars[Math.floor(Math.random() * allChars.length)]);
        }
    
        // Shuffle the password array to ensure randomness
        password = password.sort(() => Math.random() - 0.5);
    
        // Set the new password in the state
        setNewPassword(password.join(''));
    };

    // Function to add a new password
    const addPassword = () => {
        if (newUrl && newUsername && newPassword) {
            try {
                // Check if newUrl is a valid URL
                new URL(newUrl);

                const newEntry = { url: newUrl, username: newUsername, password: newPassword };
                setPasswords([...passwords, newEntry]);
                setRecentActivities([...recentActivities, `Added password for ${newUsername} at ${newUrl}`]);

                // Clear the fields after adding
                setNewUrl('');
                setNewUsername('');
                setNewPassword('');
            } catch {
                alert('Please enter a valid URL.');
            }
        } else {
            alert('Please fill in all fields.');
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


    return (
        <div className={`dashboard ${isDarkMode ? 'dark' : 'light'}`}>
            {/* Navbar */}
            <nav className="navbar">
                {/* Menu Button */}
                <div className="menu-button" onClick={() => setMenuOpen(!menuOpen)}>
                    ☰
                </div>
                <div className="navbar-brand">Password Manager</div>
                <div className="navbar-links">
                    <button onClick={handleLogout}>Logout</button>
                </div>
    
                {/* Menu Dropdown */}
                {menuOpen && (
                    <div className="dropdown-menu">
                        <p>
                            <strong>Account:</strong> {username}
                        </p>
                        <button onClick={toggleTheme}>
                            {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        </button>
                    </div>
                )}
            </nav>
    
            <h1>Welcome {username}</h1>
    
            {/* Main Container */}
            <div className="container">
                {/* Sidebar */}
                <div className="sidebar">
                    <h2>Menu</h2>
                    <button className="menu-button" onClick={() => handleContentSelect('addPassword')}>Add Password</button>
                    <button className="menu-button" onClick={() => handleContentSelect('recentActivities')}>Recent Activities</button>
                    <button className="menu-button" onClick={() => handleContentSelect('availablePasswords')}>Available Passwords</button>
                </div>
    
                {/* Content Area */}
                <div className="content">
                    {selectedContent === 'addPassword' && (
                        <div>
                            <h2>Add Password</h2>
                            <div className="form-group">
                                <input
                                    type="url"
                                    value={newUrl}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                    placeholder="Enter site URL"
                                    required
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
                                <div className="button-container">
                                    <button className="add-button" onClick={addPassword}>Add New Password</button>
                                </div>
                            </div>
                        </div>
                    )}
    
                    {selectedContent === 'recentActivities' && (
                        <div>
                            <h2>Recent Activities</h2>
                            <ul>
                                {recentActivities.map((activity, index) => (
                                    <li key={index}>
                                        {activity.startsWith("Added password for") ? (
                                            <span className="activity-highlight">{activity}</span>
                                        ) : (
                                            activity
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
    
                    {selectedContent === 'availablePasswords' && (
                        <div>
                            <h2>Available Passwords</h2>
                            <div className="button-group">
                                {/* Import Button */}
                                <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} id="file-input" />
                                <label htmlFor="file-input" className="import-btn">Import Passwords</label>
    
                                {/* Export Button */}
                                <button className="export-btn" onClick={exportPasswordsToCSV}>Export Passwords</button>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>URL</th>
                                        <th>Username</th>
                                        <th>Password</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {passwords.map((entry, index) => (
                                        <tr key={index}>
                                            <td>
                                                {editIndex === index ? (
                                                    <input
                                                        type="text"
                                                        value={editedEntry?.url || ''}
                                                        onChange={(e) => handleEditedFieldChange('url', e.target.value)}
                                                        aria-label="Edit URL"
                                                    />
                                                ) : (
                                                    entry.url
                                                )}
                                            </td>
                                            <td>
                                                {editIndex === index ? (
                                                    <input
                                                        type="text"
                                                        value={editedEntry?.username || ''}
                                                        onChange={(e) => handleEditedFieldChange('username', e.target.value)}
                                                        aria-label="Edit Username"
                                                    />
                                                ) : (
                                                    entry.username
                                                )}
                                            </td>
                                            <td>
                                                {editIndex === index ? (
                                                    <input
                                                        type="text"
                                                        value={editedEntry?.password || ''}
                                                        onChange={(e) => handleEditedFieldChange('password', e.target.value)}
                                                        aria-label="Edit Password"
                                                    />
                                                ) : (
                                                    <span
                                                        className="password-field"
                                                        onClick={() => handlePasswordClick(entry.password)}
                                                    >
                                                        {visiblePasswords[index] ? entry.password : '•'.repeat(entry.password.length)}
                                                        <button
                                                            className="toggle-visibility-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                togglePasswordVisibility(index);
                                                            }}
                                                            aria-label={
                                                                visiblePasswords[index]
                                                                    ? "Hide password"
                                                                    : "Show password"
                                                            }
                                                        >
                                                            {visiblePasswords[index] ? <FaEyeSlash /> : <FaEye />}
                                                        </button>
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="actions-group">
                                                    {editIndex === index ? (
                                                        <>
                                                            <button onClick={() => saveEdit(index)} aria-label="Save Edit">
                                                                <FaSave /> Save
                                                            </button>
                                                            <button onClick={cancelEdit} aria-label="Cancel Edit">Cancel</button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() =>
                                                                    copyCredentialsToClipboard(entry.username, entry.password)
                                                                }
                                                                aria-label="Copy credentials to clipboard"
                                                            >
                                                                <FaClipboard /> Copy
                                                            </button>
                                                            <button onClick={() => handleEdit(index)} aria-label="Edit Entry">
                                                                <FaEdit /> Edit
                                                            </button>
                                                            <button
                                                                onClick={() => deletePassword(index)}
                                                                aria-label="Delete Entry"
                                                            >
                                                                <FaTrash /> Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {passwordStrength && (
                                <div className="password-strength">
                                    <h3>Password Strength</h3>
                                    <p>Score: {passwordStrength.score}/5</p>
                                    <p>Strength: {passwordStrength.text}</p>
                                    <div className="strength-bar">
                                        <div
                                            className={`strength-level ${passwordStrength.text === 'Very Strong' ? 'strength-very-strong' : `strength-${passwordStrength.text.toLowerCase()}`}`}
                                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
    
                    {selectedContent === null && (
                        <div className="no-option-message">
                            <p>Select an option from the menu.</p>
                            <img src={dash1} className="no-option-image" alt="dash1"/>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )};
    
export default Dashboard;
