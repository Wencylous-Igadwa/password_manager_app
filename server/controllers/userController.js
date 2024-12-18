const Credential = require('../models/credentialSchema');
const User = require('../models/userSchema');
const { encryptField, decryptField } = require('../utils/encryption');
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

// Fetches credentials for a specific site 
exports.getCredentials = async (req, res) => {
    try {
        const { site_url } = req.query;
  
        // Fetch credentials for the logged-in user
        const whereCondition = { user_id: req.user.userId };
        const credentials = await Credential.findAll({
            where: whereCondition,
            attributes: [
                'site_url',
                'url_iv',
                'username',
                'username_iv',
                'password',
                'password_iv',
            ],
        });

        if (credentials.length === 0) {
            return res.status(404).json({ message: 'No credentials found' });
        }

        // Decrypt each credential's site_url and compare
        const decryptedCredentials = credentials.map((credential) => {
            const decryptedSiteUrl = decryptField(credential.site_url, credential.url_iv);

            // Only keep the credentials that match the provided site_url
            if (decryptedSiteUrl === site_url) {
                return {
                    site_url: decryptedSiteUrl,
                    username: decryptField(credential.username, credential.username_iv),
                    password: decryptField(credential.password, credential.password_iv),
                };
            }
        }).filter(Boolean);  // Filter out any undefined entries (non-matching)

        if (decryptedCredentials.length === 0) {
            return res.status(404).json({ message: 'No matching credentials found' });
        }

        res.status(200).json(decryptedCredentials);
    } catch (error) {
        console.error('Error fetching credentials:', error);
        res.status(500).json({ message: 'Failed to fetch credentials' });
    }
};

// fetches all stored credentials for a specific user
exports.fetchAllCreds = async (req, res) => {
    try {
        const whereCondition = { user_id: req.user.userId };
        const credentials = await Credential.findAll({
            where: whereCondition,
            attributes: [
                'site_url',
                'url_iv',
                'username',
                'username_iv',
                'password',
                'password_iv',
            ],
        });
  
        if (credentials.length === 0) {
            return res.status(404).json({ message: 'No credentials found' });
        }
  
        // Decrypt each field using its associated IV before sending the response
        const response = credentials.map((credential) => ({
            url: decryptField(credential.site_url, credential.url_iv),
            username: decryptField(credential.username, credential.username_iv),
            password: decryptField(credential.password, credential.password_iv),
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
        const { id, newPassword, newSiteUrl, newUsername, newNote } = req.body;
  
        if (!id || !newPassword || !newSiteUrl || !newUsername) {
            return res.status(400).json({ message: 'Credential ID, new site URL, new username, and new password are required' });
        }
  
        // Encrypt the new input fields (newUsername, newSiteUrl) to compare with encrypted data in DB
        const { encryptedUsername } = encryptField(newUsername, credential.username_iv);
        const { encryptedSiteUrl } = encryptField(newSiteUrl, credential.url_iv);
  
        // Find the credential by ID using encrypted username and site_url
        const credential = await Credential.findOne({
            where: { 
                id, 
                user_id: req.user.userId,
                username: encryptedUsername,
                site_url: encryptedSiteUrl,
            },
        });
  
        if (!credential) {
            return res.status(404).json({ message: 'Credential not found' });
        }
  
        // Initialize update fields and IVs
        const updatedFields = {};
        
        // Encrypt and update password if provided
        if (newPassword) {
            const { encryptedPassword, iv: passwordIv } = encryptPassword(newPassword);
            updatedFields.password = encryptedPassword;
            updatedFields.iv = passwordIv;
        }
        
        // Encrypt and update site_url if provided
        if (newSiteUrl) {
            const { encryptedSiteUrl, iv: urlIv } = encryptPassword(newSiteUrl);
            updatedFields.site_url = encryptedSiteUrl;
            updatedFields.url_iv = urlIv;
        }
        
        // Encrypt and update username if provided
        if (newUsername) {
            const { encryptedUsername, iv: usernameIv } = encryptPassword(newUsername);
            updatedFields.username = encryptedUsername;
            updatedFields.username_iv = usernameIv;
        }
        
        // Encrypt and update note if provided
        if (newNote) {
            const { encryptedNote, iv: noteIv } = encryptPassword(newNote);
            updatedFields.note = encryptedNote;
            updatedFields.note_iv = noteIv;
        }
  
        // Update the credential fields with encrypted values
        await credential.update(updatedFields);
  
        res.status(200).json({ message: 'Password and related fields updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'Failed to update password' });
    }
};   

// Delete a credential
exports.deletePassword = async (req, res) => {
    try {
        const { username, site_url } = req.body;

        // Check if username and URL are provided
        if (!username || !site_url) {
            return res.status(400).json({ message: 'Username and URL are required' });
        }

        // Fetch all credentials for the user
        const credentials = await Credential.findAll({
            where: {
                user_id: req.user.userId,
            },
            attributes: ['id', 'username', 'site_url', 'username_iv', 'url_iv'],
        });

        // If no credentials are found, return a 404 response
        if (credentials.length === 0) {
            console.log('No credentials found');
            return res.status(404).json({ message: 'No credentials found' });
        }

        // Iterate through each credential to find the matching one
        let credentialToDelete = null;

        for (const credential of credentials) {
            // Decrypt the stored username and site_url
            const decryptedUsername = decryptField(credential.username, credential.username_iv);
            const decryptedSiteUrl = decryptField(credential.site_url, credential.url_iv);

            // Check if the decrypted fields match the provided values
            if (decryptedUsername === username && decryptedSiteUrl === site_url) {
                credentialToDelete = credential;
                break;  // Stop once the matching credential is found
            }
        }

        // If no matching credential is found, return a 404 response
        if (!credentialToDelete) {
            console.log('Credential not found');
            return res.status(404).json({ message: 'Credential does not match' });
        }

        // Now that the credential matches, delete it
        await credentialToDelete.destroy();

        res.status(200).json({ message: 'Credential deleted successfully' });
    } catch (error) {
        console.error('Error deleting credential:', error);
        res.status(500).json({ message: 'Failed to delete credential' });
    }
};

// Save a single credential
const credentialSchema = Joi.object({
    site_url: Joi.string().uri().required(),
    username: Joi.string().min(3).max(255).required(),
    password: Joi.string().min(8).required(),
});
exports.savePassword = async (req, res) => {
    try {
        const { site_url, username, password } = req.body;

        // Validate input
        const { error } = credentialSchema.validate({ site_url, username, password });
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Normalize site_url: trim, convert to lowercase, and remove trailing slash
        const normalizedSiteUrl = site_url.trim().toLowerCase().replace(/\/$/, '');

        // Encrypt the fields (site_url, username, password)
        const { encryptedField: encryptedSiteUrl, iv: urlIv } = encryptField(normalizedSiteUrl);
        const { encryptedField: encryptedUsername, iv: usernameIv } = encryptField(username);
        const { encryptedField: encryptedPassword, iv: passwordIv } = encryptField(password);

        // Save credential to the database
        const newCredential = await Credential.create({
            user_id: req.user.userId,
            site_url: encryptedSiteUrl,
            url_iv: urlIv,
            username: encryptedUsername,
            username_iv: usernameIv,
            password: encryptedPassword,
            password_iv: passwordIv,
        });

        res.status(201).json({
            message: 'Credential saved successfully',
        });
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
          where: { user_id: req.user.userId },
          attributes: [
              'id',
              'site_url',
              'url_iv',         
              'username',
              'username_iv',   
              'password',
              'password_iv',             
              'note',
              'note_iv',
          ],
      });

      if (credentials.length === 0) {
          return res.status(404).json({ message: 'No credentials found to export' });
      }

      // Decrypt each field before sending the response
      const decryptedEntries = credentials.map((credential) => ({
          id: credential.id,
          site_url: decryptPassword(credential.site_url, credential.url_iv),  
          username: decryptPassword(credential.username, credential.username_iv), 
          password: decryptPassword(credential.password, credential.password_iv), 
          note: decryptPassword(credential.note, credential.note_iv),
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

exports.importPasswords = async (req, res) => {
    upload.single('csvFile')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: 'Error uploading file', details: err });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'CSV file is required' });
        }

        // Validate that the file is a CSV file (based on MIME type or extension)
        const fileExtension = path.extname(req.file.originalname).toLowerCase();
        const fileMimeType = req.file.mimetype;

        if (fileExtension !== '.csv' || fileMimeType !== 'text/csv') {
            return res.status(400).json({ message: 'Only CSV files are allowed' });
        }

        const filePath = path.join(__dirname, '../uploads/', req.file.filename);

        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');

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

            const passwordSchema = Joi.object({
                name: Joi.string().optional(),
                url: Joi.string().uri().required(),
                username: Joi.string().required(),
                password: Joi.string().min(8).required(),
                note: Joi.string().allow(null, '').optional(),
            });

            const passwordEntries = [];
            for (const entry of data) {
                const { error, value } = passwordSchema.validate(entry);
                if (error) {
                    return res.status(400).json({
                        message: `Validation error on entry: ${JSON.stringify(entry)}`,
                        details: error.details,
                    });
                }

                // Normalize the site_url: trim, convert to lowercase, and remove trailing slash
                const normalizedUrl = value.url.trim().toLowerCase().replace(/\/$/, '');
                const normalizedUsername = value.username.trim();

                // Encrypt the normalized fields
                const { encryptedField: encryptedUrl, iv: urlIv } = encryptField(normalizedUrl);
                const { encryptedField: encryptedUsername, iv: usernameIv } = encryptField(normalizedUsername);
                const { encryptedField: encryptedPassword, iv: passwordIv } = encryptField(value.password);
                const { encryptedField: encryptedName, iv: nameIv } = encryptField(value.name);
                const { encryptedField: encryptedNote, iv: noteIv } = encryptField(value.note || '');

                // Fetch all credentials for the user
                const credentials = await Credential.findAll({
                    where: {
                        user_id: req.user.userId,
                    },
                    attributes: ['id', 'username', 'site_url', 'username_iv', 'url_iv'],
                });

                let credentialExists = false;

                // Decrypt each credential's username and site_url and compare
                for (const credential of credentials) {
                    const decryptedUsername = decryptField(credential.username, credential.username_iv);
                    const decryptedSiteUrl = decryptField(credential.site_url, credential.url_iv);

                    // If a matching credential is found, set flag to skip this entry
                    if (decryptedUsername === normalizedUsername && decryptedSiteUrl === normalizedUrl) {
                        credentialExists = true;
                        break;
                    }
                }

                if (credentialExists) {
                    continue;  // Skip this entry if it already exists
                }

                // If not found, prepare the password entry for saving
                passwordEntries.push({
                    user_id: req.user.userId,
                    site_url: encryptedUrl,
                    url_iv: urlIv,
                    username: encryptedUsername,
                    username_iv: usernameIv,
                    password: encryptedPassword,
                    password_iv: passwordIv,
                    name: encryptedName,
                    name_iv: nameIv,
                    note: encryptedNote,
                    note_iv: noteIv, 
                });
            }

            if (passwordEntries.length > 0) {
                await Credential.bulkCreate(passwordEntries);
                res.status(200).json({ message: 'Passwords imported successfully' });
            } else {
                res.status(201).json({ message: 'No new passwords were imported as they already exist' });
            }
        } catch (error) {
            console.error('Error importing passwords:', error);
            res.status(500).json({ message: 'Failed to import passwords' });
        } finally {
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

exports.getUsername = async (req, res) => {
    try {
        const userId = req.user.userId;  // Extract userId from the request
        const user = await User.findOne({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Decrypt the username using the stored IV
        const decryptedUsername = decryptField(user.username, user.username_iv); 

        if (!decryptedUsername) {
            return res.status(400).json({ error: 'Failed to decrypt username!' });
        }
        // Respond with the decrypted username
        res.json({ username: decryptedUsername });
    } catch (error) {
        console.error('Error fetching username:', error);
        res.status(500).json({ error: 'Server error occurred while retrieving username.' });
    }
};
