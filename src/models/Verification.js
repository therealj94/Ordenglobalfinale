const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Verification = sequelize.define('Verification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('processing', 'pending', 'approved', 'rejected', 'expired', 'abandoned'),
      defaultValue: 'pending'
    },
    documentType: {
      type: DataTypes.ENUM('PASSPORT', 'ID_CARD', 'DRIVERS_LICENSE'),
      allowNull: true
    },
    documentCountry: {
      type: DataTypes.STRING,
      allowNull: true
    },
    documentNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Document images (base64). ID_CARD/DRIVERS_LICENSE need front+back, PASSPORT only front.
    documentFrontImage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    documentBackImage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Array of selfie images captured during the rotation liveness challenge
    selfieImages: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    livenessResult: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    // AML / KYC compliance declaration, captured at the time of this
    // verification (re-declared each cycle in case circumstances changed)
    sourceOfFunds: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isPEP: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      // Spelled out because the table's underscored naming turns "isPEP" into
      // "is_p_e_p" — every capital starts a new word — while the migration
      // created "is_pep". Without this every query touching this column fails,
      // which took down the whole status endpoint.
      field: 'is_pep'
    },
    pepDetails: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reviewMode: {
      type: DataTypes.ENUM('automatic', 'manual'),
      defaultValue: 'manual'
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // When the deferred automatic decision (see VerificationDecisionService)
    // should be applied — gives the user a realistic "verifying..." wait
    // instead of an instant response.
    decisionAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Free-form metadata about how the decision was made (e.g. future
    // in-house document/liveness analysis output)
    rawData: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    rejectionReason: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'Verifications'
  });

  return Verification;
};
