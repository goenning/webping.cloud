const codeToName: { [code: string]: string } = {
  AE: 'United Arab Emirates',
  AU: 'Australia',
  BE: 'Belgium',
  BH: 'Bahrain',
  BR: 'Brazil',
  CA: 'Canada',
  CH: 'Switzerland',
  CN: 'China',
  CL: 'Chile',
  DE: 'Germany',
  FI: 'Finland',
  FR: 'France',
  HK: 'Hong Kong',
  ID: 'Indonesia',
  IE: 'Ireland',
  IN: 'India',
  IT: 'Italy',
  JP: 'Japan',
  KR: 'South Korea',
  NL: 'Netherlands',
  NO: 'Norway',
  MY: 'Malaysia',
  SE: 'Sweden',
  SA: 'Saudi Arabia',
  SG: 'Singapore',
  TW: 'Taiwan',
  UK: 'United Kingdom',
  US: 'United States',
  ZA: 'South Africa',
}

export function getCountryName(countryCode: string): string {
  const name = codeToName[countryCode.toUpperCase()]
  if (!name) {
    throw new Error(`Country name not found for code '${countryCode}'`)
  }
  return name
}
