const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Credential = sequelize.define(
    'Credential',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        name_iv: {
            type: DataTypes.TEXT, 
            allowNull: true,
        },
        site_url: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        url_iv: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        username_iv: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        password: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        password_iv: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        note_iv: {
            type: DataTypes.TEXT,
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
    },
    {
        tableName: 'credentials',
        schema: 'app_data',
        underscored: true,
        timestamps: false, // Disable automatic timestamp management
    }
);

// Ensure `created_at` and `updated_at` are explicitly managed
Credential.beforeUpdate((credential, options) => {
    credential.updated_at = new Date();
});

Credential.beforeCreate((credential, options) => {
    credential.created_at = new Date(); // Explicitly set created_at
});

// Export the model for use in other parts of the application
module.exports = Credential;
