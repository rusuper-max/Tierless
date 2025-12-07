// Country code to name and flag emoji mapping

// Convert 2-letter country code to flag emoji
export function countryCodeToFlag(code: string): string {
  if (!code || code === "Unknown" || code.length !== 2) return "";
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Common country names (ISO 3166-1 alpha-2)
const COUNTRY_NAMES: Record<string, string> = {
  AF: "Afghanistan",
  AL: "Albania",
  DZ: "Algeria",
  AD: "Andorra",
  AO: "Angola",
  AR: "Argentina",
  AM: "Armenia",
  AU: "Australia",
  AT: "Austria",
  AZ: "Azerbaijan",
  BH: "Bahrain",
  BD: "Bangladesh",
  BY: "Belarus",
  BE: "Belgium",
  BA: "Bosnia and Herzegovina",
  BR: "Brazil",
  BG: "Bulgaria",
  CA: "Canada",
  CL: "Chile",
  CN: "China",
  CO: "Colombia",
  HR: "Croatia",
  CY: "Cyprus",
  CZ: "Czechia",
  DK: "Denmark",
  EG: "Egypt",
  EE: "Estonia",
  FI: "Finland",
  FR: "France",
  GE: "Georgia",
  DE: "Germany",
  GR: "Greece",
  HK: "Hong Kong",
  HU: "Hungary",
  IS: "Iceland",
  IN: "India",
  ID: "Indonesia",
  IR: "Iran",
  IQ: "Iraq",
  IE: "Ireland",
  IL: "Israel",
  IT: "Italy",
  JP: "Japan",
  JO: "Jordan",
  KZ: "Kazakhstan",
  KE: "Kenya",
  KR: "South Korea",
  KW: "Kuwait",
  LV: "Latvia",
  LB: "Lebanon",
  LT: "Lithuania",
  LU: "Luxembourg",
  MK: "North Macedonia",
  MY: "Malaysia",
  MT: "Malta",
  MX: "Mexico",
  MD: "Moldova",
  ME: "Montenegro",
  MA: "Morocco",
  NL: "Netherlands",
  NZ: "New Zealand",
  NG: "Nigeria",
  NO: "Norway",
  PK: "Pakistan",
  PH: "Philippines",
  PL: "Poland",
  PT: "Portugal",
  QA: "Qatar",
  RO: "Romania",
  RS: "Serbia",
  RU: "Russia",
  SA: "Saudi Arabia",
  SG: "Singapore",
  SK: "Slovakia",
  SI: "Slovenia",
  ZA: "South Africa",
  ES: "Spain",
  SE: "Sweden",
  CH: "Switzerland",
  TW: "Taiwan",
  TH: "Thailand",
  TR: "Turkey",
  UA: "Ukraine",
  AE: "UAE",
  GB: "United Kingdom",
  US: "United States",
  UY: "Uruguay",
  UZ: "Uzbekistan",
  VN: "Vietnam",
};

export function getCountryName(code: string): string {
  if (!code || code === "Unknown") return "Unknown";
  return COUNTRY_NAMES[code.toUpperCase()] || code;
}

export function getCountryDisplay(code: string): { flag: string; name: string } {
  if (!code || code === "Unknown") {
    return { flag: "🌐", name: "Unknown" };
  }
  return {
    flag: countryCodeToFlag(code),
    name: getCountryName(code),
  };
}
