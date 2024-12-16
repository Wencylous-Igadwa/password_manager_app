const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // Automatically generate UUID
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(512),
    allowNull: false,
    unique: true,
  },
  email_iv: {
    type: DataTypes.STRING(512),
    allowNull: false,
  },
  password_hash: {
    type: DataTypes.STRING(512),
    allowNull: false,
  },
  two_factor_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  google_oauth_id: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  google_oauth_id_iv: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
    allowNull: false,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
    allowNull: false,
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  master_password_hash: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  master_password_salt: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  username: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  username_iv: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  resetTokenHash: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
  device_id: {
    type: String,
    unique: true,
  },  
  resetTokenExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users', 
  schema: 'app_data', 
  underscored: true,
  timestamps: false,
});

// Hooks for managing timestamps
User.beforeUpdate((user, options) => {
  user.updated_at = new Date();
});

User.beforeCreate((user, options) => {
  user.created_at = new Date();  // Explicitly set created_at
});

// Export the model for use in other parts of the application
module.exports = User;
