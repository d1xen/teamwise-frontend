/** ISO country codes supported for player profiles. */
export const COUNTRY_CODES = [
  "FR", "BE", "CH", "DE", "GB", "US", "CA", "ES", "IT", "NL",
  "PT", "PL", "SE", "DK", "FI", "NO", "BR", "RU", "TR", "UA",
  "CZ", "RO", "HU", "AU", "IE", "AT", "GR", "HR", "SK", "SI",
  "BG", "LT", "LV", "EE", "RS", "BA", "ME", "MK", "AL", "IS",
  "JP", "KR", "CN",
] as const;

/** Returns country options sorted by localized label. */
export function getCountryOptions(locale: string): { value: string; label: string }[] {
  const displayNames = new Intl.DisplayNames([locale], { type: "region" });
  return COUNTRY_CODES
    .map(code => ({ value: code, label: displayNames.of(code) ?? code }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
}

/** Returns the localized name for a country code. */
export function getCountryLabel(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
