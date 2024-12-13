const express = require('express');
const Joi = require('joi');
const router = express.Router();
const verifyToken = require('../middleware/authenticateToken');
const { csrfProtection } = require('../middleware/csrfMiddleware');
const { protectedRoute, getCredentials, fetchAllCreds, updatePassword, deletePassword, savePassword, exportPasswords, importPasswords, getUsername } = require('../controllers/userController');

// Joi schema for validating the 'domain' parameter
const domainValidationSchema = Joi.object({
  domain: Joi.string().required().min(1).max(255).message('Domain is required and must be a valid string'),
});

// Protected route - Only accessible if logged in
router.get('/dashboard', verifyToken, protectedRoute);

// Route to fetch credentials for a specific domain (protected by JWT)
router.get('/get-credentials', verifyToken, csrfProtection, async (req, res, next) => {
  try {
    const { error } = domainValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    await getCredentials(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Route to fetch all credentials of a specific user
router.get('/fetch-allcreds', verifyToken, csrfProtection, async (req, res, next) => {
  try {
    await fetchAllCreds(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Update password - Protected route
router.post('/update-password', verifyToken, csrfProtection, async (req, res, next) => {
  try {
    // Ensure the request body is valid for password change
    const { error } = Joi.object({
      id: Joi.string().required().uuid(),
      newPassword: Joi.string().required().min(6).regex(/[a-zA-Z0-9]/).message('Password should be at least 6 characters long and contain letters and numbers'),
    }).validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Call the updatePassword function
    await updatePassword(req, res);
  } catch (err) {
    next(err);
  }
});

// Delete password - Protected route
router.delete('/delete-password', verifyToken, csrfProtection, async (req, res, next) => {
  try {
    // Validate request body to ensure username and url are provided
    const { error } = Joi.object({
      username: Joi.string().required(),
      site_url: Joi.string().uri().required(),
    }).validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Proceed to the controller function to delete the password
    await deletePassword(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Save a single password - Protected route
router.post('/save-password', verifyToken, csrfProtection, async (req, res, next) => {
  try {
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

router.get('/get-username', verifyToken, csrfProtection, async (req, res, next) => {
  try {
    await getUsername(req, res, next);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
