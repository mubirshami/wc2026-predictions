export interface Team {
  name: string;
  code: string;
  alpha2: string; // ISO 3166-1 alpha-2 for flagcdn.com
  confederation: string;
}

export const WC2026_TEAMS: Team[] = [
  // Hosts
  { name: "United States", code: "USA", alpha2: "us", confederation: "CONCACAF" },
  { name: "Canada",         code: "CAN", alpha2: "ca", confederation: "CONCACAF" },
  { name: "Mexico",         code: "MEX", alpha2: "mx", confederation: "CONCACAF" },
  // UEFA
  { name: "Germany",        code: "GER", alpha2: "de", confederation: "UEFA" },
  { name: "Spain",          code: "ESP", alpha2: "es", confederation: "UEFA" },
  { name: "France",         code: "FRA", alpha2: "fr", confederation: "UEFA" },
  { name: "England",        code: "ENG", alpha2: "gb-eng", confederation: "UEFA" },
  { name: "Netherlands",    code: "NED", alpha2: "nl", confederation: "UEFA" },
  { name: "Portugal",       code: "POR", alpha2: "pt", confederation: "UEFA" },
  { name: "Italy",          code: "ITA", alpha2: "it", confederation: "UEFA" },
  { name: "Belgium",        code: "BEL", alpha2: "be", confederation: "UEFA" },
  { name: "Croatia",        code: "CRO", alpha2: "hr", confederation: "UEFA" },
  { name: "Switzerland",    code: "SUI", alpha2: "ch", confederation: "UEFA" },
  { name: "Austria",        code: "AUT", alpha2: "at", confederation: "UEFA" },
  { name: "Serbia",         code: "SRB", alpha2: "rs", confederation: "UEFA" },
  { name: "Scotland",       code: "SCO", alpha2: "gb-sct", confederation: "UEFA" },
  { name: "Türkiye",        code: "TUR", alpha2: "tr", confederation: "UEFA" },
  { name: "Turkey",         code: "TUR", alpha2: "tr", confederation: "UEFA" },
  { name: "Poland",         code: "POL", alpha2: "pl", confederation: "UEFA" },
  { name: "Denmark",        code: "DEN", alpha2: "dk", confederation: "UEFA" },
  { name: "Hungary",        code: "HUN", alpha2: "hu", confederation: "UEFA" },
  { name: "Ukraine",        code: "UKR", alpha2: "ua", confederation: "UEFA" },
  { name: "Slovakia",       code: "SVK", alpha2: "sk", confederation: "UEFA" },
  { name: "Norway",         code: "NOR", alpha2: "no", confederation: "UEFA" },
  { name: "Slovenia",       code: "SVN", alpha2: "si", confederation: "UEFA" },
  { name: "Romania",        code: "ROU", alpha2: "ro", confederation: "UEFA" },
  { name: "Albania",        code: "ALB", alpha2: "al", confederation: "UEFA" },
  { name: "Georgia",        code: "GEO", alpha2: "ge", confederation: "UEFA" },
  { name: "Czechia",        code: "CZE", alpha2: "cz", confederation: "UEFA" },
  { name: "Czech Republic", code: "CZE", alpha2: "cz", confederation: "UEFA" },
  { name: "Bosnia and Herzegovina", code: "BIH", alpha2: "ba", confederation: "UEFA" },
  { name: "Bosnia-Herzegovina",     code: "BIH", alpha2: "ba", confederation: "UEFA" },
  { name: "Wales",          code: "WAL", alpha2: "gb-wls", confederation: "UEFA" },
  // CONMEBOL
  { name: "Argentina",      code: "ARG", alpha2: "ar", confederation: "CONMEBOL" },
  { name: "Brazil",         code: "BRA", alpha2: "br", confederation: "CONMEBOL" },
  { name: "Uruguay",        code: "URU", alpha2: "uy", confederation: "CONMEBOL" },
  { name: "Colombia",       code: "COL", alpha2: "co", confederation: "CONMEBOL" },
  { name: "Ecuador",        code: "ECU", alpha2: "ec", confederation: "CONMEBOL" },
  { name: "Paraguay",       code: "PAR", alpha2: "py", confederation: "CONMEBOL" },
  { name: "Venezuela",      code: "VEN", alpha2: "ve", confederation: "CONMEBOL" },
  { name: "Chile",          code: "CHI", alpha2: "cl", confederation: "CONMEBOL" },
  { name: "Peru",           code: "PER", alpha2: "pe", confederation: "CONMEBOL" },
  { name: "Bolivia",        code: "BOL", alpha2: "bo", confederation: "CONMEBOL" },
  // CONCACAF (non-host)
  { name: "Panama",         code: "PAN", alpha2: "pa", confederation: "CONCACAF" },
  { name: "Costa Rica",     code: "CRC", alpha2: "cr", confederation: "CONCACAF" },
  { name: "Jamaica",        code: "JAM", alpha2: "jm", confederation: "CONCACAF" },
  { name: "Honduras",       code: "HON", alpha2: "hn", confederation: "CONCACAF" },
  { name: "El Salvador",    code: "SLV", alpha2: "sv", confederation: "CONCACAF" },
  { name: "Guatemala",      code: "GUA", alpha2: "gt", confederation: "CONCACAF" },
  { name: "Cuba",           code: "CUB", alpha2: "cu", confederation: "CONCACAF" },
  { name: "Trinidad and Tobago", code: "TTO", alpha2: "tt", confederation: "CONCACAF" },
  // CAF
  { name: "Morocco",        code: "MAR", alpha2: "ma", confederation: "CAF" },
  { name: "Senegal",        code: "SEN", alpha2: "sn", confederation: "CAF" },
  { name: "Egypt",          code: "EGY", alpha2: "eg", confederation: "CAF" },
  { name: "Nigeria",        code: "NGA", alpha2: "ng", confederation: "CAF" },
  { name: "Côte d'Ivoire",  code: "CIV", alpha2: "ci", confederation: "CAF" },
  { name: "Ivory Coast",    code: "CIV", alpha2: "ci", confederation: "CAF" },
  { name: "South Africa",   code: "RSA", alpha2: "za", confederation: "CAF" },
  { name: "Ghana",          code: "GHA", alpha2: "gh", confederation: "CAF" },
  { name: "Cameroon",       code: "CMR", alpha2: "cm", confederation: "CAF" },
  { name: "Tunisia",        code: "TUN", alpha2: "tn", confederation: "CAF" },
  { name: "Algeria",        code: "ALG", alpha2: "dz", confederation: "CAF" },
  { name: "Mali",           code: "MLI", alpha2: "ml", confederation: "CAF" },
  { name: "DR Congo",       code: "COD", alpha2: "cd", confederation: "CAF" },
  { name: "Tanzania",          code: "TAN", alpha2: "tz", confederation: "CAF" },
  { name: "Angola",            code: "ANG", alpha2: "ao", confederation: "CAF" },
  { name: "Zambia",            code: "ZAM", alpha2: "zm", confederation: "CAF" },
  { name: "Cape Verde Islands",code: "CPV", alpha2: "cv", confederation: "CAF" },
  { name: "Cape Verde",        code: "CPV", alpha2: "cv", confederation: "CAF" },
  { name: "Congo DR",          code: "COD", alpha2: "cd", confederation: "CAF" },
  { name: "Haiti",             code: "HAI", alpha2: "ht", confederation: "CONCACAF" },
  { name: "Curaçao",           code: "CUW", alpha2: "cw", confederation: "CONCACAF" },
  { name: "Sweden",            code: "SWE", alpha2: "se", confederation: "UEFA" },
  // AFC
  { name: "Japan",          code: "JPN", alpha2: "jp", confederation: "AFC" },
  { name: "South Korea",    code: "KOR", alpha2: "kr", confederation: "AFC" },
  { name: "Korea Republic", code: "KOR", alpha2: "kr", confederation: "AFC" },
  { name: "Iran",           code: "IRN", alpha2: "ir", confederation: "AFC" },
  { name: "Saudi Arabia",   code: "KSA", alpha2: "sa", confederation: "AFC" },
  { name: "Australia",      code: "AUS", alpha2: "au", confederation: "AFC" },
  { name: "Iraq",           code: "IRQ", alpha2: "iq", confederation: "AFC" },
  { name: "Jordan",         code: "JOR", alpha2: "jo", confederation: "AFC" },
  { name: "Uzbekistan",     code: "UZB", alpha2: "uz", confederation: "AFC" },
  { name: "China",          code: "CHN", alpha2: "cn", confederation: "AFC" },
  { name: "China PR",       code: "CHN", alpha2: "cn", confederation: "AFC" },
  { name: "Indonesia",      code: "IDN", alpha2: "id", confederation: "AFC" },
  { name: "Qatar",          code: "QAT", alpha2: "qa", confederation: "AFC" },
  { name: "Bahrain",        code: "BHR", alpha2: "bh", confederation: "AFC" },
  { name: "Palestine",      code: "PLE", alpha2: "ps", confederation: "AFC" },
  { name: "India",          code: "IND", alpha2: "in", confederation: "AFC" },
  // OFC
  { name: "New Zealand",    code: "NZL", alpha2: "nz", confederation: "OFC" },
];

const TEAM_MAP = new Map(WC2026_TEAMS.map((t) => [t.name.toLowerCase(), t]));

function findTeam(name: string): Team | undefined {
  return TEAM_MAP.get(name.toLowerCase());
}

export function getTeamFlagUrl(teamName: string): string {
  const team = findTeam(teamName);
  if (!team) return "";
  return `https://flagcdn.com/w80/${team.alpha2}.png`;
}

export function getTeamCode(teamName: string): string {
  return findTeam(teamName)?.code ?? teamName.slice(0, 3).toUpperCase();
}

// kept for backwards-compat (returns emoji, not used in UI anymore)
export function getTeamFlag(teamName: string): string {
  return getTeamFlagUrl(teamName);
}

export const TEAM_NAMES = [...new Map(WC2026_TEAMS.map((t) => [t.code, t.name])).values()].sort();
