const db = require('../models');
const { missingColumnsByTable } = require('./schemaCheck');

const { sequelize } = db;

/**
 * Adds columns the models declare but the database doesn't have.
 *
 * Marking a half-run migration as applied — which the boot-time runner does
 * when a migration trips over something it had already created — leaves any
 * columns after the failure point missing, with nothing left to create them.
 * The table then looks fine until a write touches one of those columns and
 * fails with an opaque 500.
 *
 * Strictly additive: it only ever adds a missing column, and never alters or
 * drops an existing one, so it can't destroy data even if the models and the
 * database disagree about something else.
 */
async function repairMissingColumns() {
  const missing = await missingColumnsByTable();
  const tables = Object.keys(missing);
  if (!tables.length) return [];

  const qi = sequelize.getQueryInterface();
  const repaired = [];

  for (const table of tables) {
    if (missing[table].includes('<table missing>')) {
      console.error(`[schema] table "${table}" does not exist — migrations need to run.`);
      continue;
    }

    const model = Object.values(db).find((m) => {
      if (!m || !m.getTableName) return false;
      const t = m.getTableName();
      return (typeof t === 'string' ? t : t.tableName) === table;
    });
    if (!model) continue;

    for (const column of missing[table]) {
      const attr = Object.values(model.rawAttributes).find((a) => a.field === column);
      if (!attr) continue;

      // Added as nullable unless the model supplies a default: the table may
      // already hold rows, and a NOT NULL column with nothing to put in them
      // would fail. A column that exists and is nullable is recoverable; one
      // that doesn't exist at all breaks every write.
      const definition = { type: attr.type, allowNull: true };
      if (attr.defaultValue !== undefined) {
        definition.defaultValue = attr.defaultValue;
        definition.allowNull = attr.allowNull !== false;
      }

      try {
        await qi.addColumn(table, column, definition);
        repaired.push(`${table}.${column}`);
        console.warn(`[schema] added missing column ${table}.${column}`);
      } catch (error) {
        console.error(`[schema] could not add ${table}.${column}:`, error.message);
      }
    }
  }

  return repaired;
}

module.exports = { repairMissingColumns };
