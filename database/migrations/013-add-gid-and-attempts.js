'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'gid', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });
    await queryInterface.addColumn('Users', 'kyc_attempt_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Users', 'gid');
    await queryInterface.removeColumn('Users', 'kyc_attempt_count');
  }
};
