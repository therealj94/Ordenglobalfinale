const { toAlpha3 } = require('../data/countries');

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const MAX_ATTEMPTS = 10;
const GID_VALIDITY_YEARS = 4;

function randomDigit() {
  return Math.floor(Math.random() * 10).toString();
}

function randomLetter() {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)];
}

/**
 * Builds one GID candidate: GID-<2 digits><letter><3 digits>-<country alpha-3>
 * e.g. GID-85m856-hnd for a Honduran user.
 */
function buildCandidate(nationality) {
  const digits = [randomDigit(), randomDigit(), randomDigit(), randomDigit(), randomDigit()];
  const code = digits[0] + digits[1] + randomLetter() + digits[2] + digits[3] + digits[4];
  const countrySuffix = toAlpha3(nationality);
  return `GID-${code}-${countrySuffix}`;
}

/**
 * Generates a unique GID for a newly-verified user, retrying on the rare
 * chance of a collision with an existing GID.
 */
async function generateUniqueGID(User, nationality) {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const candidate = buildCandidate(nationality);
    const existing = await User.findOne({ where: { gid: candidate } });
    if (!existing) return candidate;
  }
  throw new Error('Failed to generate a unique GID after multiple attempts');
}

/**
 * Assigns a GID to a user if they don't already have one. Safe to call on
 * every approval path (automatic or manual) — idempotent.
 */
async function assignGIDIfMissing(user, User) {
  if (user.gid) return user.gid;
  const gid = await generateUniqueGID(User, user.nationality);
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt);
  expiresAt.setFullYear(expiresAt.getFullYear() + GID_VALIDITY_YEARS);
  await user.update({ gid, gidIssuedAt: issuedAt, gidExpiresAt: expiresAt });
  return gid;
}

module.exports = { buildCandidate, generateUniqueGID, assignGIDIfMissing, GID_VALIDITY_YEARS };
