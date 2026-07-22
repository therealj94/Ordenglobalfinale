'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // GENESIS ID no longer proxies to Veriff — it IS the verification engine.
    // Rename the column that used to hold Veriff's session id to a
    // provider-neutral name, and drop the redirect-flow table that only
    // existed to track Veriff hosted sessions.
    await queryInterface.renameColumn('Verifications', 'veriff_session_id', 'session_id');
    await queryInterface.removeColumn('Verifications', 'verification_token');
    await queryInterface.dropTable('VerificationSessions');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('Verifications', 'session_id', 'veriff_session_id');
    await queryInterface.addColumn('Verifications', 'verification_token', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.createTable('VerificationSessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },
      veriff_url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      external_dossier_ref: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      status: {
        type: Sequelize.ENUM('created', 'started', 'submitted', 'decided', 'abandoned'),
        defaultValue: 'created'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  }
};
