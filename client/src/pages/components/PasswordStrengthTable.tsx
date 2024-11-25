type PasswordAnalyzeEntry = {
    url: string;
    username: string;
    password: string;
    score: number;
    strengthText: string;
    suggestions: string[];
};

type PasswordStrengthTableProps = {
    password: PasswordAnalyzeEntry[];
};

const PasswordStrengthTable: React.FC<PasswordStrengthTableProps> = ({ password }) => {
    const getStrengthClass = (score: number): string => {
        switch (score) {
            case 0:
            case 1:
                return 'strength-weak';
            case 2:
                return 'strength-moderate';
            case 3:
                return 'strength-strong';
            case 4:
                return 'strength-very-strong';
            default:
                return '';
        }
    };

    // Sort passwords by score in ascending order (weakest first)
    const sortedPasswords = [...password].sort((a, b) => a.score - b.score);

    return (
        <div className="password-strength">
            <table>
                <thead>
                    <tr>
                        <th>Site</th>
                        <th>Password</th>
                        <th>Strength</th>
                        <th>Comments</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedPasswords.map((entry) => (
                        <tr key={entry.url}>
                            <td>{entry.url}</td>
                            <td>{'•'.repeat(entry.password.length)}</td>
                            <td>
                                <div className="strength-bar">
                                    <div
                                        className={`strength-level ${getStrengthClass(entry.score)}`}
                                        style={{ width: `${(entry.score / 4) * 100}%` }}
                                    ></div>
                                </div>
                                <p>{entry.strengthText}</p>
                            </td>
                            <td>
                                {entry.suggestions.length > 0 ? (
                                    <ul>
                                        {entry.suggestions.map((tip) => (
                                            <li key={tip}>{tip}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    'Strong password!'
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PasswordStrengthTable;

