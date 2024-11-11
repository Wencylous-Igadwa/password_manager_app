const express = require('express');
const router = express.Router();
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const { signup, login, logout } = require('../controllers/authController');
const verifyToken = require('../middleware/authenticateToken');

// Rate Limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 requests per IP per window
  message: {
    error: 'Too many login attempts. Please try again later.',
  },
});

// Joi Validation for signup inputs
const signupSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  username: Joi.string().trim().required().messages({
    'any.required': 'Username is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required',
  }),
});

// Joi Validation for login inputs
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
  googleToken: Joi.string().optional().messages({
    'string.base': 'Invalid Google token format',
  }),
});

// Route for user signup (supports both Google OAuth and email/password)
router.post('/signup', async (req, res, next) => {
  try {
    // Validate inputs using Joi
    const { error } = signupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ errors: error.details });
    }

    await signup(req, res);
  } catch (err) {
    next(err);
  }
});

// Route for user login (supports both Google OAuth and email/password)
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    // Validate inputs using Joi
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ errors: error.details });
    }

    await login(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Route for user logout
router.get('/logout', verifyToken, logout);

module.exports = router;
