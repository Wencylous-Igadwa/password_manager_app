const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/userSchema');
require('dotenv').config();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;

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

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None',
        maxAge: 3600000,
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

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None',
        maxAge: 3600000,
      });

      return res.status(201).json({ message: 'Signup successful' });
    } catch (err) {
      console.error("Signup Error:", err);
      return res.status(500).json({ error: 'Something went wrong during signup' });
    }
  }

  return res.status(400).json({ error: 'Email, password, or Google token required' });
};


// Login endpoint
exports.login = async (req, res) => {
  const { email, password, googleToken } = req.body;

  try {
    if (googleToken) {
      const ticket = await client.verifyIdToken({ idToken: googleToken, audience: process.env.GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      const googleEmail = payload.email;

      let user = await User.findOne({ where: { email: googleEmail } });
      if (!user) {
        user = await User.create({
          email: googleEmail,
          username: payload.name || googleEmail,
          google_oauth_id: payload.sub,
          password: null,
        });
      }

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

      // Send the token in a secure cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None',
        maxAge: 3600000
      });

      return res.status(200).json({ message: 'Login successful', userId: user.id });
    }

    if (email && password) {
      let user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.google_oauth_id) {
        return res.status(400).json({ error: 'Please use Google to login' });
      }

      const isPasswordValid = await argon2.verify(user.password_hash, password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Update last_login field in the database using Sequelize
      await user.update({ last_login: new Date() });

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

      // Send the token in a secure cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None',
        maxAge: 3600000
      });

      return res.status(200).json({ message: 'Login successful', userId: user.id });
    }

    return res.status(400).json({ error: 'Email/password or Google token required' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Logout endpoint
exports.logout = (req, res) => {
  res.clearCookie('token'); 
  return res.status(200).json({ message: 'Logged out successfully' });
};
