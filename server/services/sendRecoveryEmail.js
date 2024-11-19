const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// OAuth2 client setup
const { OAuth2 } = google.auth;
const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
);

oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

const createTransporter = async () => {
    try {
        const accessToken = await oauth2Client.getAccessToken();
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.EMAIL_USERNAME,
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                refreshToken: process.env.GMAIL_REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
            timeout: 10000, // 10 seconds timeout
        });
    } catch (error) {
        console.error('Failed to create email transporter:', error);
        throw new Error('Failed to authenticate email transporter');
    }
};

const sendRecoveryEmail = async (email, resetLink) => {
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isValidEmail(email)) {
        throw new Error('Invalid email address provided');
    }

    try {
        const transporter = await createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'Password Recovery',
            text: `To reset your password, use this link: ${resetLink}`,
            html: `<p>To reset your password, use this <a href="${resetLink}">link</a>.</p>`,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Recovery email sent to ${email}`);
    } catch (error) {
        console.error(`Failed to send recovery email to ${email}:`, error.message || error);
        throw error;
    }
};

module.exports = { sendRecoveryEmail };
