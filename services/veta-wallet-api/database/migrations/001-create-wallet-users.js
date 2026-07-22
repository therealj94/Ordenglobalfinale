'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('WalletUsers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      genesis_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true
      },
      gid: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      full_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      balance: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('WalletUsers');
  }
};
