'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Verifications', 'document_type', {
      type: Sequelize.ENUM('PASSPORT', 'ID_CARD', 'DRIVERS_LICENSE'),
      allowNull: true
    });

    await queryInterface.addColumn('Verifications', 'document_country', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Verifications', 'document_number', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Verifications', 'document_front_image', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('Verifications', 'document_back_image', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('Verifications', 'selfie_images', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: []
    });

    await queryInterface.addColumn('Verifications', 'liveness_result', {
      type: Sequelize.JSONB,
      allowNull: true
    });

    await queryInterface.addColumn('Verifications', 'review_mode', {
      type: Sequelize.ENUM('automatic', 'manual'),
      defaultValue: 'manual'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Verifications', 'document_country');
    await queryInterface.removeColumn('Verifications', 'document_number');
    await queryInterface.removeColumn('Verifications', 'document_front_image');
    await queryInterface.removeColumn('Verifications', 'document_back_image');
    await queryInterface.removeColumn('Verifications', 'selfie_images');
    await queryInterface.removeColumn('Verifications', 'liveness_result');
    await queryInterface.removeColumn('Verifications', 'review_mode');
  }
};
