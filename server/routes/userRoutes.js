const express = require('express');
const Joi = require('joi');
const router = express.Router();
const verifyToken = require('../middleware/authenticateToken');
const { csrfProtection } = require('../middleware/csrfMiddleware');
const { protectedRoute, getCredentials, updatePassword, deletePassword, savePassword, exportPasswords, importPasswords } = require('../controllers/userController');

// Joi schema for validating the 'domain' parameter
const domainValidationSchema = Joi.object({
  domain: Joi.string().required().min(1).max(255).message('Domain is required and must be a valid string'),
});

// Route to fetch credentials for a specific domain (protected by JWT)
router.post('/get-credentials', verifyToken, csrfProtection, async (req, res, next) => {
  try {
    // Validate the domain input
    const { error } = domainValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // If validation passes, call the controller method
    await getCredentials(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Protected route - Only accessible if logged in
router.get('/dashboard', verifyToken, protectedRoute);

// Update password - Protected route
router.post('/update-password', verifyToken, csrfProtection, async (req, res, next) => {
  try {
    // Ensure the request body is valid for password change
    const { error } = Joi.object({
      id: Joi.string().required().uuid(),
      newPassword: Joi.string().required().min(6).message('Password should be at least 6 characters long'),
    }).validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    await updatePassword(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Delete password - Protected route
router.delete('/delete-password', verifyToken, csrfProtection, async (req, res, next) => {
  try {
    // Ensure the request body is valid for deleting a password
    const { error } = Joi.object({
      id: Joi.string().required().uuid(),
    }).validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    await deletePassword(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Save a single password - Protected route
router.post('/save-password', verifyToken, csrfProtection, async (req, res, next) => {
  try {
    const { error } = Joi.object({
      user_id: Joi.string().required().uuid(),
      site_url: Joi.string().required(),
      username: Joi.string().required(),
      password: Joi.string().required(),
    }).validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    await savePassword(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Export passwords - Protected route
router.get('/export-passwords', verifyToken, csrfProtection, async (req, res, next) => {
  try {
    await exportPasswords(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Import passwords - Protected route
router.post('/import-passwords', verifyToken, csrfProtection, async (req, res, next) => {
  try {
    await importPasswords(req, res, next);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
