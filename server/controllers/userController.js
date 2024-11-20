const Credential = require('../models/credentialSchema');
const { encryptPassword, decryptPassword } = require('../utils/encryption');
const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Joi = require('joi');

// Protected Route for user (Example)
exports.protectedRoute = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized access: User is not logged in.' });
  }

  res.json({ message: 'This is a protected route', user: req.user });
};

// Fetch credentials for a specific site
exports.getCredentials = async (req, res) => {
  try {
      const { site_url } = req.query;

      // Fetch credentials for the logged-in user with restricted fields
      const whereCondition = { user_id: req.user.id };
      if (site_url) whereCondition.site_url = site_url;

      const credentials = await Credential.findAll({
          where: whereCondition,
          attributes: ['site_url', 'username', 'password', 'iv'], 
      });

      if (credentials.length === 0) {
          return res.status(404).json({ message: 'No credentials found' });
      }

      // Decrypt passwords before sending the response
      const response = credentials.map((credential) => ({
          site_url: credential.site_url,
          username: credential.username,
          password: decryptPassword(credential.password, credential.iv),
      }));

      res.status(200).json(response);
  } catch (error) {
      console.error('Error fetching credentials:', error);
      res.status(500).json({ message: 'Failed to fetch credentials' });
  }
};


// Update password
exports.updatePassword = async (req, res) => {
  try {
      const { id, newPassword } = req.body;

      if (!id || !newPassword) {
          return res.status(400).json({ message: 'Credential ID and new password are required' });
      }

      // Find the credential by ID
      const credential = await Credential.findOne({
          where: { id, user_id: req.user.id },
      });

      if (!credential) {
          return res.status(404).json({ message: 'Credential not found' });
      }

      // Encrypt the new password
      const { encryptedPassword, iv } = encryptPassword(newPassword);

      // Update the credential
      credential.password = encryptedPassword;
      credential.iv = iv;
      await credential.save();

      res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ message: 'Failed to update password' });
  }
};

// Delete a credential
exports.deletePassword = async (req, res) => {
  try {
      const { id } = req.body;

      if (!id) {
          return res.status(400).json({ message: 'Credential ID is required' });
      }

      // Find the credential by ID
      const credential = await Credential.findOne({
          where: { id, user_id: req.user.id },
      });

      if (!credential) {
          return res.status(404).json({ message: 'Credential not found' });
      }

      // Delete the credential
      await credential.destroy();

      res.status(200).json({ message: 'Credential deleted successfully' });
  } catch (error) {
      console.error('Error deleting credential:', error);
      res.status(500).json({ message: 'Failed to delete credential' });
  }
};

// Save a single credential
exports.savePassword = async (req, res) => {
  try {
      const { site_url, username, password } = req.body;

      // Validate input
      const { error } = credentialSchema.validate({ site_url, username, password });
      if (error) {
          return res.status(400).json({ message: error.details[0].message });
      }

      // Encrypt password
      const { encryptedPassword, iv } = encryptPassword(password);

      // Save credential to the database
      const newCredential = await Credential.create({
          user_id: req.user.id,
          site_url,
          username,
          password: encryptedPassword,
          iv,
      });

      res.status(201).json({ message: 'Credential saved successfully', data: newCredential });
  } catch (error) {
      console.error('Error saving credential:', error);
      res.status(500).json({ message: 'Failed to save credential' });
  }
};

// Export credentials to CSV
exports.exportPasswords = async (req, res) => {
  try {
      // Fetch credentials for the authenticated user
      const credentials = await Credential.findAll({
          where: { user_id: req.user.id },
          attributes: ['id', 'site_url', 'username', 'password', 'iv', 'created_at', 'updated_at'],
      });

      if (credentials.length === 0) {
          return res.status(404).json({ message: 'No credentials found to export' });
      }

      // Decrypt passwords
      const decryptedEntries = credentials.map((credential) => ({
          id: credential.id,
          site_url: credential.site_url,
          username: credential.username,
          password: decryptPassword(credential.password, credential.iv),
          created_at: credential.created_at,
          updated_at: credential.updated_at,
      }));

      // Convert to CSV format
      const csvData = Papa.unparse(decryptedEntries);

      // Send CSV file as response
      res.setHeader('Content-Disposition', 'attachment; filename=passwords_export.csv');
      res.setHeader('Content-Type', 'text/csv');
      res.status(200).send(csvData);
  } catch (error) {
      console.error('Error exporting passwords:', error);
      res.status(500).json({ message: 'Failed to export passwords' });
  }
};


// Configure multer for file upload
const upload = multer({ dest: path.join(__dirname, '../uploads/') });

// Route to import passwords from CSV (using multer for file upload)
exports.importPasswords = async (req, res) => {
  // Handle file upload with multer's single file handler
  upload.single('csvFile')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Error uploading file', details: err });
    }

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'CSV file is required' });
    }

    const filePath = path.join(__dirname, '../uploads/', req.file.filename); // Define file path

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Parse CSV file content using Papa Parse with improved configuration
      const { data, errors } = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        delimiter: ',',
        quoteChar: '"',
      });

      if (errors.length > 0) {
        console.error('CSV Parsing Errors:', errors);
        return res.status(400).json({ message: 'Error parsing CSV file', details: errors });
      }

      // Validate CSV format - password schema
      const passwordSchema = Joi.object({
        name: Joi.string().optional(),
        url: Joi.string().uri().required(),
        username: Joi.string().required(),
        password: Joi.string().min(8).required(),
        note: Joi.string().allow(null, '').optional(),
      });

      // Validate and process each entry in the CSV
      const passwordEntries = [];
      for (const entry of data) {
        const { error, value } = passwordSchema.validate(entry);
        if (error) {
          return res.status(400).json({
            message: `Validation error on entry: ${JSON.stringify(entry)}`,
            details: error.details,
          });
        }

        // Encrypt the password
        const { encryptedPassword, iv } = encryptPassword(value.password);

        passwordEntries.push({
          user_id: req.user.userId,
          site_url: value.url,
          username: value.username,
          password: encryptedPassword,
          iv,
          name: value.name,
          note: value.note || '',
        });
      }

      // Bulk insert into the database
      await Credential.bulkCreate(passwordEntries);

      res.status(200).json({ message: 'Passwords imported successfully' });
    } catch (error) {
      console.error('Error importing passwords:', error);
      res.status(500).json({ message: 'Failed to import passwords' });
    } finally {
      // Always clean up the uploaded CSV file
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
    }
  });
};





