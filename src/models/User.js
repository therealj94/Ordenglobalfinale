const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      lowercase: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    nationality: {
      type: DataTypes.STRING,
      allowNull: true
    },
    countryOfResidence: {
      type: DataTypes.STRING,
      allowNull: true
    },
    occupation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // GENESIS ID — the permanent cross-ecosystem identifier assigned once
    // verified: GID-<5 digits + 1 letter>-<nationality alpha-3>
    gid: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    kycAttemptCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    // Dedicated photo for the visual GENESIS ID card — deliberately separate
    // from the KYC selfies (a proper "ID card" style photo, taken after
    // verification, not one of the liveness-rotation captures).
    idCardPhoto: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    gidIssuedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    gidExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected', 'expired'),
      defaultValue: 'pending'
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user'
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Password reset — we store a SHA-256 hash of the emailed token (never
    // the raw token) so a database leak can't be used to reset accounts.
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'Users'
  });

  return User;
};
