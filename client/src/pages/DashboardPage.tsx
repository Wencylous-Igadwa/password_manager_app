import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';
import axiosInstance from "../utils/axiosInstance";
import { getAuthToken, getCsrfToken } from "../utils/axiosInstance";
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AddPassword from './components/AddPassword';
import RecentActivities from './components/RecentActivities';
import AvailablePasswords from './components/AvailablePasswords';
import PasswordStrengthTable from './components/PasswordStrengthTable';

// Define the props interface
interface Props {
    username: string;
    onLogout: () => void;
}

interface PasswordEntry {
    url: string;
    username: string;
    password: string;
}

interface PasswordAnalyzeEntry {
    url: string;
    username: string;
    password: string;
    score: number;          
    strengthText: string;   
    suggestions: string[];
}

type SelectedContent = 'addPassword' | 'recentActivities' | 'availablePasswords' | null;


interface VisiblePasswords {
    [index: number]: boolean;
}

const Dashboard: React.FC<Props> = ({ username, onLogout }) => {
    const navigate = useNavigate();
    const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
    const [recentActivities, setRecentActivities] = useState<{ activity: string, timestamp: string }[]>([]);
    const [newUrl, setNewUrl] = useState<string>('');
    const [newUsername, setNewUsername] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [selectedContent, setSelectedContent] = useState<SelectedContent>(null);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [editedEntry, setEditedEntry] = useState<PasswordEntry | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState<VisiblePasswords>({});
    const [importing, setImporting] = useState(false);
    const [, setError] = useState<string | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<PasswordAnalyzeEntry[]>([]);
    const [fetchedUsername, setFetchedUsername] = useState<string>(username);
    const [openDialog, setOpenDialog] = useState(false);
    
    // Password strength analyzer function
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
    
        // Update the state with an object that conforms to PasswordStrengthEntry[]
        setPasswordStrength((prevState) => [
            ...prevState,
            {
                url: '',
                username: '',
                password: password,
                score: score,
                strengthText: text,
                suggestions: [] // Add any suggestion logic here if necessary
            }
        ]);
        return { score, text };
    };       

    // Fetch all credentials data
    useEffect(() => {
        const fetchCredentials = async () => {
            try {
                const response = await axiosInstance.get('/account/fetch-allcreds');
                if (response.status === 200) {
                    setPasswords(response.data);
                }
            } catch (error) {
                console.error('Error fetching credentials:', error);
                setError('Failed to load credentials. Please try again.');
            }
        };

        fetchCredentials();
    }, []); // Empty dependency array ensures this runs only once

    // Check password strength
    useEffect(() => {
        const checkPasswordStrength = () => {
            const evaluatedPasswords = passwords.map((entry) => {
                const strength = analyzePasswordStrength(entry.password);
                return {
                    ...entry,
                    score: strength.score,
                    strengthText: strength.text,
                    suggestions: [], // Add suggestions logic here
                };
            });
            setPasswordStrength(evaluatedPasswords); // Save the evaluated passwords in state
        };

        if (passwords.length > 0) {
            checkPasswordStrength();
        }
    }, [passwords]); // Runs whenever passwords are updated

    // Fetch the username from the backend
    useEffect(() => {
        const fetchUsername = async () => {
            try {
                const response = await axiosInstance.get('/account/get-username');
                if (response.status === 200) {
                    setFetchedUsername(response.data.username);
                }
            } catch (error) {
                console.error('Error fetching username:', error);
            }
        };

        fetchUsername();
    }, []); // Empty dependency array ensures this runs only once

    const handleLogout = async () => {
        try {
            await axiosInstance.post('/auth/logout');
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            localStorage.removeItem('csrfToken');
            document.cookie = 'csrfToken=; Max-Age=0; path=/;';
            if (typeof onLogout === 'function') {
                onLogout();
            }
            setOpenDialog(true); // Open dialog after successful logout
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            console.error('Error during logout:', error);
            setError('Logout failed. Please try again.');
        }
    };

    const addPassword = async () => {
        if (newUrl && newUsername && newPassword) {
            try {
                try {
                    new URL(newUrl);
                } catch {
                    alert('Please enter a valid URL.');
                    return;
                }

                const payload = {
                    site_url: newUrl,
                    username: newUsername,
                    password: newPassword,
                };

                const response = await axiosInstance.post("/account/save-password", payload );

                if (response.status === 201) {
                    const newEntry = { url: newUrl, username: newUsername, password: newPassword };
                    setPasswords([...passwords, newEntry]);

                    const timestamp = new Date().toLocaleString();
                    setRecentActivities([...recentActivities, { activity: `Added password for ${newUsername} at ${newUrl}`, timestamp }]);

                    setNewUrl('');
                    setNewUsername('');
                    setNewPassword('');

                    alert("Password added successfully!");
                } else {
                    alert("Failed to add password. Please try again.");
                }
            } catch {
                alert('An error occurred. Please try again.');
            }
        } else {
            alert('Please fill in all fields.');
        }
    };

    const deletePassword = (index: number) => {
        const updatedPasswords = passwords.filter((_, i) => i !== index);
        setPasswords(updatedPasswords);
        deletePasswordFromDatabase(passwords[index]);
    };

    const handleEdit = (index: number) => {
        setEditIndex(index);
        setEditedEntry(passwords[index]);
    };

    const handleEditedFieldChange = (field: 'url' | 'username' | 'password', value: string) => {
        if (editedEntry) {
            setEditedEntry({ ...editedEntry, [field]: value });
        }
    };

    const saveEdit = async () => {
        if (editIndex !== null && editedEntry) {
            const updatedPasswords = [...passwords];
            updatedPasswords[editIndex] = editedEntry;
            setPasswords(updatedPasswords);
            setEditIndex(null);
            setEditedEntry(null);
            try {
                await updatePasswordInDatabase(editedEntry);
            } catch {
                setError('Failed to save changes. Please try again.');
            }
        }
    };    

    const cancelEdit = () => {
        setEditIndex(null);
        setEditedEntry(null);
    };

    const updatePasswordInDatabase = async (passwordEntry: PasswordEntry) => {
        try {
            await axiosInstance.post('/account/update-password', passwordEntry);
        } catch (error) {
            console.error('Failed to update password:', error);
            setError('Failed to update password. Please try again.');
        }
    };

    const deletePasswordFromDatabase = async (passwordEntry: PasswordEntry) => {
        try {
            await axiosInstance.delete('/account/delete-password', {
                data: passwordEntry,
            });
        } catch (error) {
            console.error('Failed to delete password:', error);
            setError('Failed to delete password. Please try again.');
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

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append('csvFile', file);

            setImporting(true);
            setError(null);

            try {

                const csrfToken = await getCsrfToken();
                const authToken = getAuthToken();

                const response = await axiosInstance.post('/account/import-passwords', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-CSRF-Token': csrfToken,
                        'Authorization': `Bearer ${authToken}`
                    },
                });

                if (response.status === 200) {
                    alert('Passwords imported successfully!');
                }
            } catch (err) {
                console.error('Error importing passwords:', err);
                setError('Failed to import passwords. Please check the file format.');
            } finally {
                setImporting(false);
            }
        }
    };
    const exportPasswordsToCSV = async () => {
        try {
            const response = await axiosInstance.get('/account/export-passwords');
            if (response.status !== 200) {
                console.error('Failed to fetch passwords for export');
                return;
            }

            const passwordsToExport: PasswordEntry[] = response.data;
            const csvData = Papa.unparse(passwordsToExport);
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = 'passwords_export.csv';
            link.click();

            URL.revokeObjectURL(url);
            setRecentActivities([...recentActivities, { activity: 'Exported passwords to CSV', timestamp: new Date().toLocaleString() }]);
        } catch (error) {
            console.error('Error exporting passwords:', error);
            setError('Failed to export passwords. Please try again.');
        }
    };

    const copyCredentialsToClipboard = (index: number) => {
        const password = passwords[index];
        const textToCopy = `Username: ${password.username}\nPassword: ${password.password}`;
        navigator.clipboard.writeText(textToCopy)
            .then(() => alert("Username and Password copied to clipboard!"))
            .catch((err) => console.error("Failed to copy text: ", err));
    };

    const handlePasswordClick = (password: string) => {
        analyzePasswordStrength(password); // This updates the passwordStrength state
        setSelectedContent('availablePasswords'); // Ensure content is set to show passwords
    };    

    const togglePasswordVisibility = (index: number) => {
        setVisiblePasswords((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };


     // Dark/Light mode
     const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        document.body.classList.toggle('dark-mode', !isDarkMode);
    };

    const handleContentSelect = (content: SelectedContent) => {
        setSelectedContent(content);
    };

    const handleMenuToggle = () => {
        setMenuOpen(!menuOpen);
    };

    const handleCloseDialog = useCallback(() => {
        setOpenDialog(false);
    }, []);    

    return (
        <div className={`dashboard ${isDarkMode ? 'dark' : 'light'}`}>
            <Navbar 
                username={username} 
                handleLogout={handleLogout} 
                toggleTheme={toggleTheme} 
                menuOpen={menuOpen} 
                handleMenuToggle={handleMenuToggle} 
                isDarkMode={isDarkMode} 
            />
            <h1>Welcome, {fetchedUsername}</h1>
    
            {/* Main Container */}
            <div className="container">
                <Sidebar handleContentSelect={handleContentSelect} />
                <div className="content">
                    {/* Default content showing PasswordStrengthTable */}
                    {selectedContent === null && (
                        <>
                            <h2>Your Passwords</h2>
                            <PasswordStrengthTable password={passwordStrength} />
                        </>
                    )}
                    
                    {selectedContent === 'availablePasswords' && (
                        <AvailablePasswords
                            passwords={passwords}
                            visiblePasswords={visiblePasswords}
                            togglePasswordVisibility={togglePasswordVisibility}
                            editIndex={editIndex}
                            editedEntry={editedEntry}
                            handleEditedFieldChange={handleEditedFieldChange}
                            saveEdit={saveEdit}
                            cancelEdit={cancelEdit}
                            copyCredentialsToClipboard={copyCredentialsToClipboard}
                            handleEdit={handleEdit}
                            deletePassword={deletePassword}
                            importing={importing}
                            exportPasswordsToCSV={exportPasswordsToCSV}
                            handleFileUpload={handleFileUpload}
                            onPasswordClick={handlePasswordClick}
                        />
                    )}
                    {selectedContent === 'addPassword' && (
                        <AddPassword
                            newUrl={newUrl}
                            newUsername={newUsername}
                            newPassword={newPassword}
                            setNewUrl={setNewUrl} // Function to update the URL
                            setNewUsername={setNewUsername} // Function to update the username
                            setNewPassword={setNewPassword} // Function to update the password
                            addPassword={addPassword} // Function to handle password addition
                            generatePassword={generatePassword} // Function to generate a random password
                        />
                    )}
                    {selectedContent === 'recentActivities' && (
                        <RecentActivities
                            recentActivities={recentActivities.map((activityObj) => {
                                // Format the activity string as required
                                const { activity, timestamp } = activityObj;
                                return `${activity} (${timestamp})`;
                            })}
                        />
                    )}
                </div>
            </div>
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Logout Successful</DialogTitle>
                <DialogContent>
                    <p>You have logged out successfully!</p>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">Close</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
    };
    
    export default Dashboard;
    
