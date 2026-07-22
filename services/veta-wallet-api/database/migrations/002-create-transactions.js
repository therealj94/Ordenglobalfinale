'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      from_wallet_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'WalletUsers', key: 'id' }
      },
      from_gid: {
        type: Sequelize.STRING,
        allowNull: true
      },
      to_wallet_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'WalletUsers', key: 'id' }
      },
      to_gid: {
        type: Sequelize.STRING,
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('transfer', 'welcome_bonus'),
        allowNull: false,
        defaultValue: 'transfer'
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('completed', 'failed'),
        allowNull: false,
        defaultValue: 'completed'
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
    await queryInterface.dropTable('Transactions');
  }
};
