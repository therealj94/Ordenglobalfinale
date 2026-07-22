'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ManualReviewCases', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      verification_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Verifications', key: 'id' },
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Manual review required'
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      },
      reviewed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'Users', key: 'id' }
      },
      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      review_notes: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('ManualReviewCases', ['status']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('ManualReviewCases');
  }
};
