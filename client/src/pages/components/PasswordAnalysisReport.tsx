import { jsPDF } from 'jspdf';
import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

type PasswordAnalyzeEntry = {
    url: string;
    username: string;
    password: string;
    score: number;
    strengthText: string;
    suggestions: string[];
};

type PasswordAnalysisReportProps = {
    password: PasswordAnalyzeEntry[];
};

const PasswordAnalysisReport: React.FC<PasswordAnalysisReportProps> = ({ password }) => {
    const [selectedStrength, setSelectedStrength] = React.useState<string>('all'); // State to hold the selected strength

    // Get CSS class based on score

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

     // Calculate password strength distribution
     const calculateStrengthDistribution = () => {
        const distribution = { weak: 0, moderate: 0, strong: 0, veryStrong: 0 };
        password.forEach((entry) => {
            switch (entry.score) {
                case 2:
                    distribution.weak++;
                    break;
                case 3:
                    distribution.moderate++;
                    break;
                case 4:
                    distribution.strong++;
                    break;
                case 5:
                    distribution.veryStrong++;
                    break;
                default:
                    break;
            }
        });
        return distribution;

    };


    const strengthDistribution = calculateStrengthDistribution();

    const pieChartData = {
        labels: ['Weak', 'Moderate', 'Strong', 'Very Strong'],
        datasets: [
            {
                data: [
                    strengthDistribution.weak,
                    strengthDistribution.moderate,
                    strengthDistribution.strong,
                    strengthDistribution.veryStrong,
                ],
                backgroundColor: ['#ff4d4f', '#ffa940', '#1890ff','#52c41a'],
                hoverBackgroundColor: ['#ff7875', '#ffc069', '#40a9ff','#73d13d'],
            },
        ],
    };

    // Function to generate and download the PDF report
    const generatePDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4'); 
        const filteredPasswords = filterPasswordsByStrength(selectedStrength); 

        if (filteredPasswords.length === 0) {
            alert('No passwords match the selected strength criteria.');
            return;
        }

        // Title for the report - Centered
        doc.setFontSize(18);
        const title = 'Password Analysis Report';
        const titleWidth = doc.getTextWidth(title); 
        const xPosition = (297 - titleWidth) / 2;  
        doc.text(title, xPosition, 20);

        // Define column widths for a balanced layout
        const colWidths = {
            url: 100,        
            strength: 50,     
            comments: 120,   
        };

        // Adjusted space between Site and Strength columns
        const columnSpacing = 20; 
        const strengthToCommentsSpacing = 10; 

        // Add table headers
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Site', 14, 30);
        doc.text('Strength', 14 + colWidths.url + columnSpacing, 30); 
        doc.text('Comments', 14 + colWidths.url + colWidths.strength + columnSpacing - strengthToCommentsSpacing, 30); 

        // Draw a line after the header (extended to full page width)
        doc.line(14, 32, 297, 32); 

        // Reset font to normal for the table content
        doc.setFont('helvetica', 'normal');

        let yPosition = 40;
        const lineHeight = 15; 
        const padding = 5; 
        const lineSpacing = 15; 

        // Loop through the filtered passwords and add each row to the PDF
        filteredPasswords.forEach((entry) => {
            
            const comments = generateComments(entry.score);
            const wrappedUrl = doc.splitTextToSize(entry.url, colWidths.url);

            doc.text(wrappedUrl, 14, yPosition);
            doc.text(entry.strengthText, 14 + colWidths.url + columnSpacing, yPosition); // Adjusted position

            // Comments with text wrapping
            const suggestionsText = comments.length > 0 ? comments.join(', ') : 'Strong password!';
            const wrappedComments = doc.splitTextToSize(suggestionsText, colWidths.comments);
            doc.text(wrappedComments, 14 + colWidths.url + colWidths.strength + columnSpacing - strengthToCommentsSpacing, yPosition); // Adjusted position

            // Draw a horizontal line below each row (extended to full page width)
            doc.line(14, yPosition + lineSpacing, 297, yPosition + lineSpacing); 

            // Move down for the next row with added padding
            yPosition += lineHeight + padding + lineSpacing;

            // Check if the current page has enough space, otherwise add a new page
            if (yPosition > 180) { 
                doc.addPage();
                yPosition = 20; 
                doc.setFontSize(12); 
            }
        });

        // Save the document as a PDF
        doc.save('password-strength-report.pdf');
    };

    return (
        <div className="password-strength" style={{ textAlign: 'center', margin: '20px' }}>
            {/* Display total number of passwords */}
            <div>
                <h3>Total Passwords: {password.length}</h3>
            </div>

            {/* Pie chart for password strength distribution */}
            <div>
                <h3>Password Strength Distribution</h3>
                <div style={{ width: '300px', margin: '0 auto' }}>
                    <Pie data={pieChartData} />
                </div>
            </div>

            {/* Dropdown for selecting strength */}
            <div style={{ marginTop: '20px' }}>
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

            {/* Add a button to download the report as PDF */}
            <button className="download-report" onClick={generatePDF} style={{ marginTop: '20px' }}>
            Download Report as PDF
        </button>
        </div>
    );
};

export default PasswordAnalysisReport;