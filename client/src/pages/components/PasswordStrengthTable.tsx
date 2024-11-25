import { jsPDF } from "jspdf";

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

    // Function to generate and download the PDF report
    const generatePDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape format (l) for A4 paper

        // Title for the report
        doc.setFontSize(18);
        doc.text('Password Strength Report', 14, 20);

        // Define column widths for a balanced layout
        const colWidths = {
            url: 70,         // URL column width
            password: 50,    // Password column width
            strength: 40,    // Strength column width
            comments: 100,   // Comments column width
        };

        // Add table headers
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Site', 14, 30);
        doc.text('Password', 14 + colWidths.url, 30);
        doc.text('Strength', 14 + colWidths.url + colWidths.password, 30);
        doc.text('Comments', 14 + colWidths.url + colWidths.password + colWidths.strength, 30);

        // Reset font to normal for the table content
        doc.setFont('helvetica', 'normal');

        let yPosition = 40;
        const lineHeight = 10; // Line height for each row

        // Loop through the sorted passwords and add each row to the PDF
        sortedPasswords.forEach((entry) => {
            // Masked password
            const passwordMasked = '•'.repeat(entry.password.length);

            // Wrap URL text to fit in the page
            const wrappedUrl = doc.splitTextToSize(entry.url, colWidths.url);

            // Site (wrapped)
            doc.text(wrappedUrl, 14, yPosition);

            // Password (masked)
            doc.text(passwordMasked, 14 + colWidths.url, yPosition);

            // Strength
            doc.text(entry.strengthText, 14 + colWidths.url + colWidths.password, yPosition);

            // Comments with text wrapping
            const suggestionsText = entry.suggestions.length > 0 ? entry.suggestions.join(', ') : 'Strong password!';
            const wrappedComments = doc.splitTextToSize(suggestionsText, colWidths.comments);
            doc.text(wrappedComments, 14 + colWidths.url + colWidths.password + colWidths.strength, yPosition);

            // Move down for the next row
            yPosition += lineHeight;

            // Check if the current page has enough space, otherwise add a new page
            if (yPosition > 180) { // Adjusted for landscape layout
                doc.addPage();
                yPosition = 20; // Reset position for new page
                doc.setFontSize(12); // Set font size for new page
            }
        });

        // Save the document as a PDF
        doc.save('password-strength-report.pdf');
    };

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

            {/* Add a button to download the report as PDF */}
            <button onClick={generatePDF} style={{ marginTop: '20px' }}>
                Download Report as PDF
            </button>
        </div>
    );
};

export default PasswordStrengthTable;
