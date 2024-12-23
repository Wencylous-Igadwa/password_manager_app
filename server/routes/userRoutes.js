const express = require('express');
const Joi = require('joi');
const router = express.Router();
const verifyToken = require('../middleware/authenticateToken');
const upload = require('../middleware/multer')
const { csrfProtection } = require('../middleware/csrfMiddleware');
const { protectedRoute, getCredentials, fetchAllCreds, updatePassword, deletePassword, savePassword, exportPasswords, importPasswords, getUsername } = require('../controllers/userController');

// Protected route - Only accessible if logged in
router.get('/dashboard', verifyToken, protectedRoute);

// Define a schema to validate the site_url
const siteUrlValidationSchema = Joi.object({
  site_url: Joi.string().uri().required().messages({
    'string.uri': 'Invalid site URL format.',
    'any.required': 'Site URL is required.'
  })
});

// Route to fetch credentials for a specific domain (protected by JWT)
router.get('/get-credentials', verifyToken, csrfProtection, async (req, res, next) => {
  try {
    // Decode the site_url query parameter
    const { site_url } = req.query;
    if (site_url) {
      req.query.site_url = decodeURIComponent(site_url);
    }

    // Validate the decoded site_url
    const { error } = siteUrlValidationSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Proceed to fetch credentials
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
router.get('/account/export-passwords', verifyToken, csrfProtection, async (req, res) => {
  try {
      const passwords = await getPasswordsForExport(req.user);
      if (!passwords) {
          return res.status(404).json({ error: 'No passwords found.' });
      }
      res.status(200).json(passwords); // Ensure you're sending the correct data
  } catch (error) {
      console.error('Error exporting passwords:', error);
      res.status(500).json({ error: 'Failed to export passwords.' });
  }
});

// Import passwords - Protected route
router.post(
  '/import-passwords',
  verifyToken,
  upload.single('csvFile'),
  csrfProtection,
  async (req, res, next) => {
      if (!req.file) {
          return res.status(400).json({ message: 'CSV file is required' });
      }

      try {
          await importPasswords(req, res, next);
      } catch (err) {
          if (err instanceof multer.MulterError) {
              return res.status(400).json({ message: err.message });
          }
          if (err.message === 'Only CSV files are allowed') {
              return res.status(400).json({ message: err.message });
          }
          next(err); // Pass other errors to the global error handler
      }
  }
);



router.get('/get-username', verifyToken, csrfProtection, async (req, res, next) => {
  try {
    await getUsername(req, res, next);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
