const db = require('../models');

const { sequelize } = db;

/**
 * Columns the models expect but that the database doesn't actually have,
 * grouped by table.
 *
 * A schema that's behind the code is the one production failure that looks
 * like nothing is wrong — the process boots, /health answers, and then a
 * write blows up with a generic 500. This used to inspect only the User
 * table, which meant a Verification column going missing was invisible right
 * up until someone tried to submit a verification and got "Failed to submit
 * KYC data" with nothing to go on. Every model is checked now.
 */
async function missingColumnsByTable() {
  const models = Object.values(db).filter((m) => m && m.rawAttributes && m.getTableName);
  const result = {};

  for (const model of models) {
    const tableName = model.getTableName();
    const table = typeof tableName === 'string' ? tableName : tableName.tableName;

    const [rows] = await sequelize.query(
      'SELECT column_name FROM information_schema.columns WHERE table_name = :table',
      { replacements: { table } }
    );

    // No such table at all is a bigger problem than a missing column, and
    // worth reporting as exactly that rather than as "every column missing".
    if (rows.length === 0) {
      result[table] = ['<table missing>'];
      continue;
    }

    const present = new Set(rows.map((r) => r.column_name));
    // rawAttributes maps model attribute -> real column name, which is what
    // matters here: the models use underscored naming, so idCardPhoto lives
    // in the database as id_card_photo.
    const missing = Object.values(model.rawAttributes)
      .map((attr) => attr.field)
      .filter((column) => column && !present.has(column));

    if (missing.length) result[table] = missing;
  }

  return result;
}

/** Flat list, kept for callers that only need "is anything missing?". */
async function missingUserColumns() {
  const byTable = await missingColumnsByTable();
  return byTable.Users || [];
}

module.exports = { missingColumnsByTable, missingUserColumns };
