// One-time recovery utility for a specific situation: an environment where
// the server booted at least once with the old sync()-in-production
// behavior, so the database already has the full modern schema even though
// `npx sequelize-cli db:migrate` hasn't recorded most migrations as run.
// Running `npm run migrate` in that state fails with "already exists" on
// every migration after the schema diverged.
//
// This marks a known list of migrations as applied in SequelizeMeta WITHOUT
// re-running their up() — safe here specifically because the table/column
// shape they'd create already matches (sync() built it from the same
// current models). Not a general-purpose tool; the migration list below is
// hand-picked for this one incident.
require('dotenv').config();
const { Sequelize } = require('sequelize');

const env = process.env.NODE_ENV || 'production';
const config = require('../src/config/database.js')[env];

const MIGRATIONS_ALREADY_SATISFIED_BY_SYNC = [
  '007-add-kyc-fields-to-verifications.js',
  '008-create-manual-review-cases.js',
  '009-add-role-to-users.js',
  '010-create-connected-apps.js',
  '011-remove-veriff-dependency.js',
  '012-add-aml-fields.js',
  '013-add-gid-and-attempts.js',
  '014-add-verification-processing.js',
  '015-add-password-reset.js'
];

async function main() {
  const sequelize = new Sequelize(config.database, config.username, config.password, config);
  for (const name of MIGRATIONS_ALREADY_SATISFIED_BY_SYNC) {
    await sequelize.query(
      'INSERT INTO "SequelizeMeta" (name) VALUES (:name) ON CONFLICT DO NOTHING',
      { replacements: { name } }
    );
    console.log('marked as applied:', name);
  }
  await sequelize.close();
  console.log('Done. Run `npm run migrate` next to confirm everything is up to date.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
