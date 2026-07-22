'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Profile-level KYC fields (persist across verifications)
    await queryInterface.addColumn('Users', 'date_of_birth', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
    await queryInterface.addColumn('Users', 'nationality', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Users', 'country_of_residence', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Users', 'occupation', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // AML declaration fields (captured per verification submission)
    await queryInterface.addColumn('Verifications', 'source_of_funds', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Verifications', 'is_pep', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });
    await queryInterface.addColumn('Verifications', 'pep_details', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Users', 'date_of_birth');
    await queryInterface.removeColumn('Users', 'nationality');
    await queryInterface.removeColumn('Users', 'country_of_residence');
    await queryInterface.removeColumn('Users', 'occupation');
    await queryInterface.removeColumn('Verifications', 'source_of_funds');
    await queryInterface.removeColumn('Verifications', 'is_pep');
    await queryInterface.removeColumn('Verifications', 'pep_details');
  }
};
