// The apprenticeship currently accepts applicants based in the US or Canada
// only. Codes are ISO 3166-1 alpha-2 so they line up with the geoip country
// codes stored on the user at registration (registrationCountry).
export const APPLICATION_COUNTRY_CODES = ['US', 'CA'] as const;
export type ApplicationCountryCode = (typeof APPLICATION_COUNTRY_CODES)[number];

export const COUNTRY_LABELS: Record<ApplicationCountryCode, string> = {
  US: 'United States',
  CA: 'Canada',
};
