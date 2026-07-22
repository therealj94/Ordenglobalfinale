'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const email = (process.env.ADMIN_EMAIL || 'admin@ordenglobal.com').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

    const existing = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" WHERE email = :email`,
      { replacements: { email }, type: Sequelize.QueryTypes.SELECT }
    );

    if (existing.length > 0) {
      // Already exists, just make sure it's an admin
      await queryInterface.sequelize.query(
        `UPDATE "Users" SET role = 'admin' WHERE email = :email`,
        { replacements: { email } }
      );
      console.log(`Admin user already existed, promoted to admin: ${email}`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await queryInterface.bulkInsert('Users', [{
      id: uuidv4(),
      email,
      password: hashedPassword,
      full_name: 'GENESIS ID Admin',
      status: 'verified',
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    console.log(`✅ Admin user created: ${email} (password from ADMIN_PASSWORD env var)`);
  },

  down: async (queryInterface) => {
    const email = (process.env.ADMIN_EMAIL || 'admin@ordenglobal.com').toLowerCase();
    await queryInterface.bulkDelete('Users', { email });
  }
};
