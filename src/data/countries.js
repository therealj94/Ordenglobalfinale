// ISO 3166-1 alpha-2 -> alpha-3 mapping, matching the country list used in
// the AML form (apps/web/lib/countries.ts). Used to build the GID country
// suffix (e.g. Honduras: HN -> hnd).
const ALPHA2_TO_ALPHA3 = {
  AF: 'AFG', AL: 'ALB', DZ: 'DZA', AR: 'ARG', AU: 'AUS', AT: 'AUT',
  BS: 'BHS', BH: 'BHR', BD: 'BGD', BB: 'BRB', BE: 'BEL', BZ: 'BLZ',
  BO: 'BOL', BR: 'BRA', CA: 'CAN', CL: 'CHL', CN: 'CHN', CO: 'COL',
  CR: 'CRI', CU: 'CUB', DK: 'DNK', DO: 'DOM', EC: 'ECU', EG: 'EGY',
  SV: 'SLV', EE: 'EST', FI: 'FIN', FR: 'FRA', DE: 'DEU', GR: 'GRC',
  GT: 'GTM', HN: 'HND', HK: 'HKG', IN: 'IND', ID: 'IDN', IR: 'IRN',
  IQ: 'IRQ', IE: 'IRL', IL: 'ISR', IT: 'ITA', JM: 'JAM', JP: 'JPN',
  JO: 'JOR', KR: 'KOR', KW: 'KWT', LB: 'LBN', MY: 'MYS', MX: 'MEX',
  MA: 'MAR', NL: 'NLD', NZ: 'NZL', NI: 'NIC', NG: 'NGA', NO: 'NOR',
  PK: 'PAK', PA: 'PAN', PY: 'PRY', PE: 'PER', PH: 'PHL', PL: 'POL',
  PT: 'PRT', PR: 'PRI', QA: 'QAT', RO: 'ROU', RU: 'RUS', SA: 'SAU',
  SG: 'SGP', ZA: 'ZAF', ES: 'ESP', SE: 'SWE', CH: 'CHE', TW: 'TWN',
  TH: 'THA', TR: 'TUR', AE: 'ARE', GB: 'GBR', US: 'USA', UY: 'URY',
  VE: 'VEN', VN: 'VNM'
};

function toAlpha3(alpha2) {
  if (!alpha2) return 'unk';
  return (ALPHA2_TO_ALPHA3[alpha2.toUpperCase()] || 'unk').toLowerCase();
}

module.exports = { ALPHA2_TO_ALPHA3, toAlpha3 };
