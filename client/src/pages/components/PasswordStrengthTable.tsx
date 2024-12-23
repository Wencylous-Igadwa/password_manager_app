import React from 'react';

type PasswordAnalyzeEntry = {
    url: string;
    username: string;
    password: string;
    score: number;
    strengthText: string;
    suggestions: string[];
};


// Define the calculatePasswordStrength function
const calculatePasswordStrength = (password: string): { score: number; strength: string } => {
    let score = 0;
    let strength = 'Weak';
  
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
  
    switch (score) {
      case 1:
      case 2:
        strength = 'Weak';
        break;
      case 3:
        strength = 'Moderate';
        break;
      case 4:
        strength = 'Strong';
        break;
      case 5:
        strength = 'Very Strong';
        break;
    }
  
    return { score, strength };
  };

// Component Props type
interface PasswordStrengthTableProps {
  passwords: PasswordAnalyzeEntry[]; // Expected prop type
}

// Main component
const PasswordStrengthTable: React.FC<PasswordStrengthTableProps> = ({ passwords }) => {

  // Function to generate comments based on password strength
const generateComment = (strength: string) => {
    switch (strength) {
      case 'Very Strong':
        return 'Excellent password strength!';
      case 'Strong':
        return [
            "Password is strong, but try adding a symbol for enhanced security.",
            "Consider making the password long.",
        ];
      case 'Moderate':
        return [
            "Password is moderate. Adding more special characters can improve security.",
            "Consider making the password long.",
        ];
      case 'Weak':
        return [
            "Password is weak. Consider adding a mix of uppercase and lowercase letters.",
            "Include numbers and special characters to increase strength.",
        ];
      default:
        return '';
    }
  };

    // Sort passwords by strength (weakest first)
    const sortedPasswords = passwords.sort((a, b) => {
        const aStrength = calculatePasswordStrength(a.password);
        const bStrength = calculatePasswordStrength(b.password);
    
        // Sort weak passwords first
        return aStrength.score - bStrength.score;
      });

  return (
    <div>
      <h2>Password Strength Table</h2>
      <table id="password-table">
        <thead>
          <tr>
            <th>URL</th>
            <th>Username</th>
            <th>Password Strength</th>
            <th>Comments</th>
          </tr>
        </thead>
        <tbody>
        {sortedPasswords.map((entry, index) => {
            const { strength, score } = calculatePasswordStrength(entry.password);
            const comment = generateComment(strength);

            return (
              <tr key={index}>
                <td>{entry.url}</td>
                <td>{entry.username}</td>
                <td>
                {strength} 
                  <div className="strength-bar-container">
                  <div
                      className="strength-bar"
                      style={{
                        width: `${(score / 5) * 100}%`,
                        backgroundColor: getStrengthColor(strength),
                      }}
                    ></div>
                    
                  </div>
                </td>
                <td>{comment}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Function to get strength color based on strength
const getStrengthColor = (strength: string): string => {
    switch (strength) {
      case 'Very Strong':
        return 'green';
      case 'Strong':
        return 'lightblue';
      case 'Moderate':
        return 'orange';
      case 'Weak':
        return 'red';
      default:
        return 'gray';
    }
  };

export default PasswordStrengthTable;
