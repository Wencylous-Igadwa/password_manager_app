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
    handlePasswordClick: (index: number) => void;
    editIndex: number | null; // Allow null for no editing state
    editedEntry: PasswordEntry | null;
    handleEditedFieldChange: (field: 'url' | 'username' | 'password', value: string) => void;
    saveEdit: () => void;
    cancelEdit: () => void;
    copyCredentialsToClipboard: (index: number) => void;
    handleEdit: (index: number) => void;
    deletePassword: (index: number) => void;
    importing: boolean;
    exportPasswordsToCSV: () => void;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    passwordStrength?: PasswordStrength;
};

const AvailablePasswords: React.FC<AvailablePasswordsProps> = ({
    passwords,
    visiblePasswords,
    handlePasswordClick,
    editIndex,
    editedEntry,
    handleEditedFieldChange,
    saveEdit,
    cancelEdit,
    handleEdit,
    deletePassword,
    importing,
    exportPasswordsToCSV,
    handleFileUpload,
    passwordStrength,
}) => (
    <div>
        <h2>Available Passwords</h2>
        {/* Export and Import Buttons */}
        <div className="button-group">
            <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="file-input"
                disabled={importing}
            />
            <label htmlFor="file-input" className="import-btn">
                Import Passwords
            </label>
            <button className="export-btn" onClick={exportPasswordsToCSV}>
                Export Passwords
            </button>
        </div>

        {/* Password Table */}
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
                                    type="password"
                                    value={editedEntry?.password || ''}
                                    onChange={(e) => handleEditedFieldChange('password', e.target.value)}
                                    aria-label="Edit Password"
                                />
                            ) : visiblePasswords[index] ? (
                                entry.password
                            ) : (
                                '••••••••'
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
                                    <button onClick={() => handleEdit(index)}>Edit</button>
                                    <button onClick={() => deletePassword(index)}>Delete</button>
                                    <button onClick={() => handlePasswordClick(index)}>Copy</button>
                                </>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>

        {/* Password Strength */}
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
);

export default AvailablePasswords;
