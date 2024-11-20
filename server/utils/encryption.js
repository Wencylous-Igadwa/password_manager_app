const crypto = require('crypto');

// Use a 32-byte secret key for AES-256-CBC
const SECRET_KEY = crypto.randomBytes(32); 
const ALGORITHM = 'aes-256-cbc';

exports.encryptPassword = (password) => {
    // Use a 16-byte IV for AES-256-CBC
    const iv = crypto.randomBytes(16);  // AES block size is 16 bytes
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { encryptedPassword: encrypted, iv: iv.toString('hex') };  // Return IV as hex string
};

exports.decryptPassword = (encryptedPassword, iv) => {
    // Convert the IV from hex string to Buffer
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedPassword, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
