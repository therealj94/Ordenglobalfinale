'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_Verifications_status" ADD VALUE IF NOT EXISTS 'processing';`
    );
    await queryInterface.addColumn('Verifications', 'decision_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Verifications', 'decision_at');
    // Postgres doesn't support removing an enum value; left as-is.
  }
};
