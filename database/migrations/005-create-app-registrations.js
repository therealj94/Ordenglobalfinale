'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AppRegistrations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      app_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },
      linked_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      last_activity_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      api_key: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
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

    await queryInterface.addIndex('AppRegistrations', ['app_name', 'user_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('AppRegistrations');
  }
};
