import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faTrash, faEdit,  faCopy } from '@fortawesome/free-solid-svg-icons';
type PasswordEntry = {
    url: string;
    username: string;
    password: string;
};

type PasswordStrength = {
    score: number;
    text: string;
};

type AvailablePasswordsProps = {
    passwords: PasswordEntry[];
    visiblePasswords: { [index: number]: boolean };
    togglePasswordVisibility: (index: number) => void;
    editIndex: number | null;
    editedEntry: PasswordEntry | null;
    handleEditedFieldChange: (field: 'url' | 'username' | 'password', value: string) => void;
    saveEdit: () => void;
    cancelEdit: () => void;
    handleEdit: (index: number) => void;
    deletePassword: (index: number) => void;
    copyCredentialsToClipboard: (index: number) => void;
    importing: boolean;
    exportPasswordsToCSV: () => void;
    isExporting: boolean;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const AvailablePasswords: React.FC<AvailablePasswordsProps> = ({
    passwords,
    visiblePasswords,
    togglePasswordVisibility,
    editIndex,
    editedEntry,
    handleEditedFieldChange,
    saveEdit,
    cancelEdit,
    handleEdit,
    copyCredentialsToClipboard,
    deletePassword,
    importing,
    exportPasswordsToCSV,
    handleFileUpload,
    isExporting,
}) => {
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

    const calculatePasswordStrength = (password: string): PasswordStrength => {
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
    
        return { score, text };
    };
    

    const handlePasswordClick = (password: string) => {
        const strength = calculatePasswordStrength(password);
        setPasswordStrength(strength);
    };

    return (
        <div>
            <h2>Available Passwords</h2>
                {/* Export and Import Buttons */}
                <div className="button-group">
                    {/* Updated the input field to use name="csvFile" */}
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        id="file-input"
                        name="csvFile" // This ensures the correct field name for file upload
                        disabled={importing}
                    />
                    <label htmlFor="file-input" className="import-btn">
                        Import Passwords
                    </label>
                    <button className="export-btn" onClick={exportPasswordsToCSV} disabled={isExporting}>
                    {isExporting ? 'Exporting...' : 'Export Passwords'}
                    </button>
                </div>

            {/* Password Table */}
            <table>
                <thead>
                    <tr>
                        <th>Site</th>
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
                                        type="password"
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
                                        
                                    </span>
                                )}
                            </td>
                            <td>
                                {editIndex === index ? (
                                    <>
                                        <button onClick={saveEdit}>Save</button>
                                        <button onClick={cancelEdit}>Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => handleEdit(index)} aria-label="Edit" title="Edit"
                                            style={{ background: 'none', border: 'none', padding: '8px', marginRight: '10px' }}
                                            >
                                                    <FontAwesomeIcon icon={faEdit} style={{ fontSize: '24px' }}/>
                                                </button>
                                                <button onClick={() => deletePassword(index)} aria-label="Delete" title="Delete"
                                                    style={{ background: 'none', border: 'none', padding: '8px', marginRight: '10px' }}
                                                    >
                                                    <FontAwesomeIcon icon={faTrash} style={{ fontSize: '24px' }} />
                                                </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                togglePasswordVisibility(index);
                                            }}

                                            aria-label="Show/Hide" title="Show/Hide"
                                            style={{ background: 'none', border: 'none', padding: '8px', marginRight: '10px' }}
                                        >
                                          <FontAwesomeIcon
                                                icon={visiblePasswords[index] ? faEyeSlash : faEye} style={{ fontSize: '24px' }}
                                            />

                                        </button>
                                        <button onClick={() => copyCredentialsToClipboard(index)} 
                                        aria-label="Copy" title="Copy"
                                        style={{ background: 'none', border: 'none', padding: '8px', marginRight: '10px' }}
                                        >
                                            <FontAwesomeIcon icon={faCopy} style={{ fontSize: '24px' }}/>
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Password Strength Display */}
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
    );
};

export default AvailablePasswords;
