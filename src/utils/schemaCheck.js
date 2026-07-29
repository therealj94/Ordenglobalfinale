const { sequelize, User } = require('../models');

/**
 * Columns the User model expects but that the database doesn't actually have.
 *
 * A schema that's behind the code is the one production failure that looks
 * like nothing is wrong — the process boots, /health answers, and then every
 * write blows up with a generic 500. This makes that state visible without
 * needing shell access to the server.
 */
async function missingUserColumns() {
  const tableName = User.getTableName();
  const table = typeof tableName === 'string' ? tableName : tableName.tableName;

  const [rows] = await sequelize.query(
    'SELECT column_name FROM information_schema.columns WHERE table_name = :table',
    { replacements: { table } }
  );
  const present = new Set(rows.map((r) => r.column_name));

  // rawAttributes maps model attribute -> real column name, which is what
  // matters here: the models use underscored naming, so idCardPhoto lives in
  // the database as id_card_photo.
  return Object.values(User.rawAttributes)
    .map((attr) => attr.field)
    .filter((column) => column && !present.has(column));
}

module.exports = { missingUserColumns };
