const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/userSchema');
require('dotenv').config();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const { sendRecoveryEmail } = require('../services/sendRecoveryEmail');
const frontendUrl = process.env.FRONTEND_URL;
const { encryptField, encryptEmail, encryptGoogleOauthId, decryptEmail } = require('../utils/encryption');
const refreshTokens = [];
const generateDeviceId = () => crypto.randomBytes(16).toString('hex');

// Sign up endpoint
exports.signup = async (req, res) => {
    const { email, username, password, googleToken } = req.body;

    if (googleToken) {
      try {
          // Verify Google token
          const ticket = await client.verifyIdToken({
              idToken: googleToken,
              audience: process.env.GOOGLE_CLIENT_ID,
          });
          const payload = ticket.getPayload();
          const googleEmail = payload.email;
          const googleOauthId = payload.sub;
  
          // Encrypt email with a static IV
          const encryptedGoogleEmail = encryptEmail(googleEmail);
  
          // Encrypt google_oauth_id with a static IV
          const encryptedGoogleOauthId = encryptGoogleOauthId(googleOauthId);
          const googleEmailIv = process.env.STATIC_EMAIL_IV;
          const STATIC_GOOGLE_OAUTH_IV = process.env.STATIC_GOOGLE_OAUTH_IV;
  
          // Check if user already exists
          let user = await User.findOne({
              where: { email: encryptedGoogleEmail, email_iv: googleEmailIv },
          });
  
          if (!user) {
              // Encrypt username dynamically
              const { encryptedField: encryptedUsername, iv: usernameIv } = encryptField(payload.name || googleEmail);
              const placeholderPassword = 'google-oauth-user'; // Placeholder value for Google users
              const passwordHash = await argon2.hash(placeholderPassword, {
                type: argon2.argon2id,
                memoryCost: 2 ** 16,
                timeCost: 3,
                parallelism: 3,
              });
  
              // Create new user
              user = await User.create({
                  email: encryptedGoogleEmail,
                  email_iv: googleEmailIv,
                  username: encryptedUsername,
                  username_iv: usernameIv,
                  google_oauth_id: encryptedGoogleOauthId,
                  google_oauth_id_iv: STATIC_GOOGLE_OAUTH_IV,
                  password_hash: passwordHash,
                  device_id: generateDeviceId(),
              });
          }

          // Set tokens using plain email for user context
          setTokens(res, user.id, googleEmail);
  
          return res.status(201).json({ message: 'Signup successful' });
      } catch (err) {
          console.error("Google OAuth Error:", err);
          return res.status(400).json({ error: 'Invalid Google token' });
      }
    }

    if (email && password) {
        try {
            const encryptedEmail = encryptEmail(email);
            const emailIv = process.env.STATIC_EMAIL_IV;

            let user = await User.findOne({ where: { email: encryptedEmail, email_iv: emailIv } });

            if (user) {
                return res.status(400).json({ error: 'User already exists with this email' });
            }

            const hashedPassword = await argon2.hash(password, {
                type: argon2.argon2id,
                memoryCost: 2 ** 16,
                timeCost: 3,
                parallelism: 1,
            });

            const { encryptedField: encryptedUsername, iv: usernameIv } = encryptField(username);

            user = new User({
                email: encryptedEmail,
                email_iv: emailIv,
                username: encryptedUsername,
                username_iv: usernameIv,
                password_hash: hashedPassword,
                device_id: generateDeviceId(),
            });

            setTokens(res, user.id, email);
            return res.status(201).json({ message: 'Signup successful' });

        } catch (err) {
            console.error("Signup Error:", err);
            return res.status(500).json({ error: 'Something went wrong during signup' });
        }
    }

    return res.status(400).json({ error: 'Email, password, or Google token required' });
};

exports.loginWithEmailPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Encrypt email using the static IV
    const encryptedEmail = encryptEmail(email);

    // Look up the user by encrypted email
    const user = await User.findOne({ where: { email: encryptedEmail } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the user is a Google OAuth user
    if (user.google_oauth_id) {
      return res.status(400).json({ error: 'Please use Google to login' });
    }

    // Verify the password
    const isPasswordValid = await argon2.verify(user.password_hash, password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Decrypt email (optional)
    const decryptedEmail = decryptEmail(user.email);

    // Update the last login timestamp
    await user.update({ last_login: new Date() });

    // Set tokens and send response with token, refreshToken, and deviceId
    const { token, refreshToken, deviceId } = setTokens(res, user.id, decryptedEmail, user.device_id);

    return res.status(200).json({ message: 'Login successful', token, refreshToken, deviceId });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

exports.loginWithGoogle = async (req, res) => {
  const { googleToken } = req.body;

  try {
    if (!googleToken) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const googleEmail = payload.email;
    const googleOauthId = payload.sub;

    // Encrypt email with a static IV
    const encryptedGoogleEmail = encryptEmail(googleEmail);

    // Encrypt google_oauth_id with a static IV
    const encryptedGoogleOauthId = encryptGoogleOauthId(googleOauthId);
    const googleEmailIv = process.env.STATIC_EMAIL_IV;
    const STATIC_GOOGLE_OAUTH_IV = process.env.STATIC_GOOGLE_OAUTH_IV;

    // Check if user already exists
    let user = await User.findOne({
      where: { email: encryptedGoogleEmail, email_iv: googleEmailIv },
    });

    if (!user) {
      // Encrypt username dynamically
      const { encryptedField: encryptedUsername, iv: usernameIv } = encryptField(payload.name || googleEmail);
      const placeholderPassword = 'google-oauth-user'; // Placeholder value for Google users
      const passwordHash = await argon2.hash(placeholderPassword, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 3,
      });

      // Create new user
      user = await User.create({
        email: encryptedGoogleEmail,
        email_iv: googleEmailIv,
        username: encryptedUsername,
        username_iv: usernameIv,
        google_oauth_id: encryptedGoogleOauthId,
        google_oauth_id_iv: STATIC_GOOGLE_OAUTH_IV,
        password_hash: passwordHash,
        device_id: generateDeviceId(),
      });
    }

    // Set tokens using plain email for user context
    const { token, refreshToken, deviceId } = setTokens(res, user.id, googleEmail, user.device_id);

    return res.status(200).json({ message: 'Google login successful', token, refreshToken, deviceId });
  } catch (err) {
    console.error('Google Login Error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

function setTokens(res, userId, email, deviceId) {
  const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ userId, email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  refreshTokens.push(refreshToken);

  res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 3600000,
  });
  res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 604800000,
  });

  return { token, refreshToken, deviceId };
}

// Refresh Token endpoint
exports.refreshToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token is required' });
  }

  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json({ error: 'Invalid refresh token' });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send new access token as response
    res.json({ token: newAccessToken });
  } catch (err) {
    console.error('Error verifying refresh token:', err);
    return res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
};

exports.authenticateDevice = async (req, res, next) => {
  const { deviceId } = req.headers;
  const { userId } = req.user;

  if (!deviceId) {
      return res.status(401).json({ error: 'Device ID is required' });
  }

  const user = await User.findById(userId);
  if (user.device_id !== deviceId) {
      return res.status(403).json({ error: 'Device not authorized' });
  }
  next();
};

exports.checkAuth = (req, res) => {
  if (req.user) {
    return res.status(200).json({ message: 'User is authenticated' });
  }
  return res.status(401).json({ error: 'Unauthorized' });
};

// Password Reset
const hashResetToken = (resetToken) => {
  return crypto.createHash('sha256').update(resetToken).digest('hex');
};

// Controller for requesting password reset
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const encryptedEmail = encryptEmail(email);
    const user = await User.findOne({ where: { email: encryptedEmail } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate a password reset token with userId and purpose
    const resetToken = jwt.sign({ purpose: 'password-reset', id: user.id }, JWT_SECRET, { expiresIn: '15m' });

    const resetTokenHash = hashResetToken(resetToken);
    const resetTokenExpires = new Date(Date.now() + 900000); // 15 mins from now

    user.resetTokenHash = resetTokenHash;
    user.resetTokenExpires = resetTokenExpires;
    await user.save();

    const resetLink = `${frontendUrl}/reset-password/${encodeURIComponent(resetToken)}`;

    try {
      await sendRecoveryEmail(email, resetLink);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      return res.status(500).json({ message: 'Failed to send password reset email. Please try again later.' });
    }

    res.status(200).json({ message: 'Password reset link has been sent to your email' });
  } catch (err) {
    console.error('Error processing password reset request:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Utility function to verify and decode the reset token
async function verifyResetTokenLogic(token) {
  if (!token) {
    throw new Error('Token is required');
  }

  const decoded = jwt.verify(token, JWT_SECRET);

  if (!decoded || !decoded.id || decoded.purpose !== 'password-reset') {
    throw new Error('Invalid token structure or purpose');
  }

  const user = await User.findOne({ where: { id: decoded.id } });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.resetTokenExpires && isTokenExpired(user.resetTokenExpires)) {
    throw new Error('Reset token has expired');
  }

  return { decoded, user };
}

// Controller to verify the reset token
exports.verifyResetToken = async (req, res) => {
  const { token } = req.params;

  try {
    // Use the common token verification logic
    await verifyResetTokenLogic(token);
    res.status(200).json({ message: 'Token is valid' });
  } catch (err) {
    console.error('Error verifying reset token:', err);
    res.status(400).json({ message: err.message });
  }
};

// Controller for resetting password
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  try {
    // Use the common token verification logic
    const { user } = await verifyResetTokenLogic(token);

    // Hash the new password and update the user
    user.password = await argon2.hash(newPassword);
    user.resetTokenHash = null;
    user.resetTokenExpires = null;

    await user.save();
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(400).json({ message: err.message });
  }
};

// Function to check if the token is expired
function isTokenExpired(expirationDate) {
  return new Date() > new Date(expirationDate);
}

// Logout endpoint
exports.logout = (req, res) => {
  user.device_id = null;
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  return res.status(200).json({ message: 'Logged out successfully' });
};