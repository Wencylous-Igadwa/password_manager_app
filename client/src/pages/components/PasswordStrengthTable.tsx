import { jsPDF } from 'jspdf';
import React from 'react';

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
    const [selectedStrength, setSelectedStrength] = React.useState<string>('all'); // State to hold the selected strength

    // Get CSS class based on score
    const getStrengthClass = (score: number): string => {
        switch (score) {
            case 2:
                return 'strength-weak';        
            case 3:
                return 'strength-moderate'; 
            case 4:
                return 'strength-strong'; 
            case 5:
                return 'strength-very-strong';
            default:
                return '';
        }
    };

    // Generate comments based on score
    const generateComments = (score: number): string[] => {
        switch (score) {
            case 2:
                return [
                    "Password is weak. Consider adding a mix of uppercase and lowercase letters.",
                    "Include numbers and special characters to increase strength.",
                ];
            case 3:
                return [
                    "Password is moderate. Adding more special characters can improve security.",
                    "Consider making the password longer for better protection.",
                ];
            case 4:
                return [
                    "Password is strong, but try adding a symbol for enhanced security.",
                    "Consider using a longer passphrase for increased security.",
                ];
            case 5:
                return [
                    "Very strong password! Excellent work.",
                ];
            default:
                return [];
        }
    };

    // Sort passwords by score (weakest first)
    const sortedPasswords = [...password].sort((a, b) => a.score - b.score);

    // Filter passwords based on selected strength
    const filterPasswordsByStrength = (strength: string) => {
        if (strength === 'all') return sortedPasswords;
        const strengthMap: { [key: string]: number[] } = {
            weak: [2],
            moderate: [3],
            strong: [4],
            veryStrong: [5],
        };
        return sortedPasswords.filter(entry => strengthMap[strength]?.includes(entry.score));
    };

    // Function to generate and download the PDF report
    const generatePDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape format (l) for A4 paper
        const filteredPasswords = filterPasswordsByStrength(selectedStrength); // Get passwords based on selected strength

        if (filteredPasswords.length === 0) {
            alert('No passwords match the selected strength criteria.');
            return;
        }

        // Title for the report - Centered
        doc.setFontSize(18);
        const title = 'Password Strength Report';
        const titleWidth = doc.getTextWidth(title); // Correct method to get text width
        const xPosition = (297 - titleWidth) / 2;  // Calculate the X position to center the title
        doc.text(title, xPosition, 20);

        // Define column widths for a balanced layout
        const colWidths = {
            url: 100,         // URL column width (increased for better layout)
            strength: 50,     // Strength column width
            comments: 120,    // Comments column width (increased for better fit)
        };

        // Adjusted space between Site and Strength columns
        const columnSpacing = 20; // Adjust this value to increase the gap between columns
        const strengthToCommentsSpacing = 10; // Reduce the space between Strength and Comments columns

        // Add table headers
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Site', 14, 30);
        doc.text('Strength', 14 + colWidths.url + columnSpacing, 30); // Increased gap
        doc.text('Comments', 14 + colWidths.url + colWidths.strength + columnSpacing - strengthToCommentsSpacing, 30); // Reduced gap

        // Draw a line after the header (extended to full page width)
        doc.line(14, 32, 297, 32); // Draw a line across the page, just below the header

        // Reset font to normal for the table content
        doc.setFont('helvetica', 'normal');

        let yPosition = 40;
        const lineHeight = 15; // Increased line height for padding between rows
        const padding = 5; // Padding between rows for better spacing
        const lineSpacing = 15; // Increased line spacing between rows

        // Loop through the filtered passwords and add each row to the PDF
        filteredPasswords.forEach((entry) => {
            // Generate the comments based on the score
            const comments = generateComments(entry.score);

            // Wrap URL text to fit in the page
            const wrappedUrl = doc.splitTextToSize(entry.url, colWidths.url);

            // Site (wrapped)
            doc.text(wrappedUrl, 14, yPosition);

            // Strength
            doc.text(entry.strengthText, 14 + colWidths.url + columnSpacing, yPosition); // Adjusted position

            // Comments with text wrapping
            const suggestionsText = comments.length > 0 ? comments.join(', ') : 'Strong password!';
            const wrappedComments = doc.splitTextToSize(suggestionsText, colWidths.comments);
            doc.text(wrappedComments, 14 + colWidths.url + colWidths.strength + columnSpacing - strengthToCommentsSpacing, yPosition); // Adjusted position

            // Draw a horizontal line below each row (extended to full page width)
            doc.line(14, yPosition + lineSpacing, 297, yPosition + lineSpacing); // Draw line from left to right edge

            // Move down for the next row with added padding
            yPosition += lineHeight + padding + lineSpacing;

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
            {/* Dropdown for selecting strength */}
            <div>
                <label htmlFor="strengthFilter">Filter by Strength: </label>
                <select
                    id="strengthFilter"
                    value={selectedStrength}
                    onChange={(e) => setSelectedStrength(e.target.value)}
                >
                    <option value="all">All</option>
                    <option value="weak">Weak</option>
                    <option value="moderate">Moderate</option>
                    <option value="strong">Strong</option>
                    <option value="veryStrong">Very Strong</option>
                </select>
            </div>

            {/* Table displaying passwords */}
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
                    {sortedPasswords.map((entry) => {
                        // Generate appropriate comments based on the password score
                        const comments = generateComments(entry.score);

                        return (
                            <tr key={entry.url}>
                                <td>{entry.url}</td>
                                <td>{'•'.repeat(entry.password.length)}</td>
                                <td>
                                    <div className="strength-bar">
                                        <div
                                            className={`strength-level ${getStrengthClass(entry.score)}`}
                                            style={{ width: `${(entry.score / 5) * 100}%` }}
                                        ></div>
                                    </div>
                                    <p>{entry.strengthText}</p>
                                </td>
                                <td>
                                    {comments.length > 0 ? (
                                        <ul>
                                            {comments.map((tip, index) => (
                                                <li key={index}>{tip}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        'Strong password!'
                                    )}
                                </td>
                            </tr>
                        );
                    })}
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
