// The apprenticeship currently accepts applicants based in the US or Canada
// only. Codes are ISO 3166-1 alpha-2 so they line up with the geoip country
// codes tracked on the account at registration.
export const APPLICATION_COUNTRY_CODES = ["US", "CA"] as const;
export type ApplicationCountryCode = (typeof APPLICATION_COUNTRY_CODES)[number];

export const COUNTRY_LABELS: Record<ApplicationCountryCode, string> = {
  US: "United States",
  CA: "Canada",
};

export const APPLICATION_COUNTRY_OPTIONS = APPLICATION_COUNTRY_CODES.map(
  (code) => ({ value: code, label: COUNTRY_LABELS[code] }),
);

/** Human-readable country name for a stored code, falling back to the code. */
export const countryLabel = (code: string | null | undefined): string =>
  code ? (COUNTRY_LABELS[code as ApplicationCountryCode] ?? code) : "";
