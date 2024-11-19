const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/userSchema');
require('dotenv').config();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const { sendRecoveryEmail } = require('../services/sendRecoveryEmail');
const { validationResult } = require('express-validator');
const EMAIL_JWT_EXPIRATION = '1h';
const frontendUrl = process.env.FRONTEND_URL;

// In-memory storage for refresh tokens
let refreshTokens = [];

// Sign up endpoint
exports.signup = async (req, res) => {
  const { email, username, password, googleToken } = req.body;

  if (googleToken) {
    try {
      console.time("Google Token Verification");
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      console.timeEnd("Google Token Verification");

      const payload = ticket.getPayload();
      const googleEmail = payload.email;

      console.time("Database User Lookup");
      let user = await User.findOne({ where: { email: googleEmail } });
      console.timeEnd("Database User Lookup");

      if (!user) {
        user = new User({
          email: googleEmail,
          username: payload.name || googleEmail,
          google_oauth_id: payload.sub,
          password_hash: null,
        });
        console.time("Database Save New User");
        await user.save();
        console.timeEnd("Database Save New User");
      }

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
      const refreshToken = jwt.sign({ userId: user.id, email: user.email }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

      // Store refresh token securely
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
        maxAge: 604800000, // 7 days
      });

      return res.status(201).json({ message: 'Signup successful' });
    } catch (err) {
      console.error("Google OAuth Error:", err);
      return res.status(400).json({ error: 'Invalid Google token' });
    }
  }

  if (email && password) {
    try {
      let user = await User.findOne({ where: { email } });
      if (user) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const hashedPassword = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });

      user = new User({
        email,
        username,
        password_hash: hashedPassword,
      });

      await user.save();

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
      const refreshToken = jwt.sign({ userId: user.id, email: user.email }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

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
        maxAge: 604800000, // 7 days
      });

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

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the user is a Google OAuth user
    if (user.google_oauth_id) {
      return res.status(400).json({ error: 'Please use Google to login' });
    }

    const isPasswordValid = await argon2.verify(user.password_hash, password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login timestamp
    await user.update({ last_login: new Date() });

    // Generate JWT tokens
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id, email: user.email }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    refreshTokens.push(refreshToken);

    // Set cookies
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

    res.status(200).json({ message: 'Login successful', userId: user.id });
  } catch (err) {
    console.error(err);
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

    // Find or create user based on Google email
    let user = await User.findOne({ where: { email: googleEmail } });

    if (!user) {
      // Create a placeholder password hash for Google users
      const placeholderPassword = 'google-oauth-user'; // Placeholder password
      const passwordHash = await argon2.hash(placeholderPassword); // Hash the placeholder password using argon2

      // Create user with the generated password hash
      user = await User.create({
        email: googleEmail,
        username: payload.name || googleEmail,
        google_oauth_id: payload.sub,
        password_hash: passwordHash, // Assign the placeholder password hash
      });
    }

    // Generate JWT tokens
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id, email: user.email }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    refreshTokens.push(refreshToken);

    // Set cookies
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

    res.status(200).json({ message: 'Google login successful', userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

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

exports.checkAuth = (req, res) => {
  if (req.user) {
    return res.status(200).json({ message: 'User is authenticated' });
  }
  return res.status(401).json({ error: 'Unauthorized' });
};

// Password Reset
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Find the user by email
    console.log('Querying for user with email:', email);
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user signed in with Google (google_oauth_id is not null)
    if (user.google_oauth_id) {
      return res.status(400).json({ message: 'Password reset is not available for Google accounts. Please sign in with Google.' });
    }

    // Generate a password reset token using the UUID `id`
    const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: EMAIL_JWT_EXPIRATION,
    });

    // Construct the reset link
    const resetLink = `${frontendUrl}/forgot_password/${resetToken}`;
    console.log(`Generated reset link: ${resetLink}`);

    // Send the recovery email
    try {
      await sendRecoveryEmail(email, resetLink);
      console.log(`Password reset email sent to: ${email}`);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      return res.status(500).json({ message: 'Failed to send password reset email. Please try again later.' });
    }

    // Respond with success
    res.status(200).json({ message: 'Password reset link has been sent to your email' });
  } catch (error) {
    console.error('Error during password reset request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
exports.verifyResetToken = async (req, res) => {
    const { token } = req.params;

    try {
        // Verify the reset token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Optionally: Render a form for the user to enter a new password
        res.status(200).json({ message: 'Token is valid', data: decoded });
    } catch (error) {
        res.status(400).json({ message: 'Invalid or expired token' });
    }
};

// Update Password 
exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        // Verify the reset token
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        // Find user in the database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Validate the new password
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        const hashedPassword = await argon2.hash(newPassword);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(400).json({ message: 'Invalid or expired token' });
    }
};

// Logout endpoint
exports.logout = (req, res) => {
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  return res.status(200).json({ message: 'Logged out successfully' });
};