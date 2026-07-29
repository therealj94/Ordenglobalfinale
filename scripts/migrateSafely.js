// Runs pending migrations, healing the one failure mode a long-lived
// environment reliably hits: a migration that tries to create something the
// database already has.
//
// That state comes from history, not from a mistake — this project used to
// call sequelize.sync() in production, so those databases already carry the
// modern schema while SequelizeMeta has no record of the migrations that
// would have built it. Every deploy then dies on "already exists", and with
// migrations running at boot that takes the whole service down.
//
// So: when a migration fails *because the thing it creates is already there*,
// the schema is already where that migration wanted it — record it as applied
// and carry on. Any other failure is a real problem and stops the deploy,
// because booting against a schema the code doesn't match is how you get a
// service that answers /health and then 500s on every write.
require('dotenv').config();
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const config = require('../src/config/database.js')[env];

const ALREADY_EXISTS = /already exists|duplicate column|duplicate_object|duplicate key value/i;

function runMigrations() {
  try {
    const stdout = execFileSync('npx', ['sequelize-cli', 'db:migrate'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return { ok: true, output: stdout };
  } catch (error) {
    const output = `${error.stdout || ''}\n${error.stderr || ''}`;
    return { ok: false, output };
  }
}

// The CLI announces each migration before running it, so the last one
// announced is the one that failed.
function failingMigration(output) {
  const matches = [...output.matchAll(/==\s+(\S+):\s+migrating/g)];
  const name = matches.length ? matches[matches.length - 1][1] : null;
  if (!name) return null;
  // The CLI prints the name without the extension; SequelizeMeta stores it with.
  const dir = path.resolve(__dirname, '..', 'database', 'migrations');
  const file = fs.readdirSync(dir).find((f) => f.startsWith(name));
  return file || `${name}.js`;
}

async function markApplied(name) {
  const sequelize = new Sequelize(config.database, config.username, config.password, config);
  try {
    await sequelize.query(
      'CREATE TABLE IF NOT EXISTS "SequelizeMeta" (name VARCHAR(255) NOT NULL PRIMARY KEY)'
    );
    await sequelize.query('INSERT INTO "SequelizeMeta" (name) VALUES (:name) ON CONFLICT DO NOTHING', {
      replacements: { name }
    });
  } finally {
    await sequelize.close();
  }
}

async function main() {
  const migrationCount = fs
    .readdirSync(path.resolve(__dirname, '..', 'database', 'migrations'))
    .filter((f) => f.endsWith('.js')).length;

  // Bounded by the number of migrations: each pass either finishes or retires
  // exactly one of them, so this can't spin.
  for (let attempt = 0; attempt <= migrationCount; attempt++) {
    const { ok, output } = runMigrations();
    process.stdout.write(output);

    if (ok) {
      console.log('Migrations up to date.');
      return;
    }

    if (!ALREADY_EXISTS.test(output)) {
      console.error('Migration failed for a reason that needs a human. Not starting.');
      process.exit(1);
    }

    const name = failingMigration(output);
    if (!name) {
      console.error('A migration failed on "already exists" but the migration could not be identified. Not starting.');
      process.exit(1);
    }

    console.warn(
      `\n[schema] "${name}" tried to create something this database already has — ` +
        'recording it as applied and continuing.\n'
    );
    await markApplied(name);
  }

  console.error('Migrations still failing after reconciling every migration. Not starting.');
  process.exit(1);
}

main().catch((err) => {
  console.error('Migration runner crashed:', err);
  process.exit(1);
});
