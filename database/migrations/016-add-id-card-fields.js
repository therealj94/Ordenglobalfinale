'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'id_card_photo', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('Users', 'gid_issued_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('Users', 'gid_expires_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Users', 'id_card_photo');
    await queryInterface.removeColumn('Users', 'gid_issued_at');
    await queryInterface.removeColumn('Users', 'gid_expires_at');
  }
};
