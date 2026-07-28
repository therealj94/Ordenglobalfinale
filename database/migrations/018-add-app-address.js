'use strict';

// Each ecosystem app can hand GENESIS ID the account identifier it knows the
// user by — Veta Wallet's wallet address, My Token Pay's merchant id, etc. —
// so the identity engine can link a GID to that app's own account.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('AppRegistrations', 'address', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('AppRegistrations', 'address');
  }
};
