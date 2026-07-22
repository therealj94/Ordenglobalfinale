/**
 * Capitalizes the first letter of every word (also after a hyphen or
 * apostrophe) — "josé garcía-lópez" -> "José García-López". Supports
 * accented Latin letters via the Unicode letter property.
 */
function toTitleCase(str) {
  if (typeof str !== 'string') return str;
  return str
    .trim()
    .toLowerCase()
    .replace(/(^|[\s'-])\p{L}/gu, (match) => match.toUpperCase());
}

module.exports = { toTitleCase };
