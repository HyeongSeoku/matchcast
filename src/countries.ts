import type { Locale } from "./i18n.js";

export interface Country {
  code: string;
  name: string;
  flag: string;
  timeZone: string;
  group: Locale;
}

export const COUNTRIES: Country[] = [
  { code: "KR", name: "대한민국 (Korea)", flag: "🇰🇷", timeZone: "Asia/Seoul", group: "ko" },

  { code: "US", name: "United States", flag: "🇺🇸", timeZone: "America/New_York", group: "en" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", timeZone: "Europe/London", group: "en" },
  { code: "CA", name: "Canada", flag: "🇨🇦", timeZone: "America/Toronto", group: "en" },
  { code: "AU", name: "Australia", flag: "🇦🇺", timeZone: "Australia/Sydney", group: "en" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", timeZone: "Pacific/Auckland", group: "en" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", timeZone: "Europe/Dublin", group: "en" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", timeZone: "Africa/Johannesburg", group: "en" },
  { code: "IN", name: "India", flag: "🇮🇳", timeZone: "Asia/Kolkata", group: "en" },

  { code: "JP", name: "日本 (Japan)", flag: "🇯🇵", timeZone: "Asia/Tokyo", group: "ja" },

  { code: "ES", name: "España", flag: "🇪🇸", timeZone: "Europe/Madrid", group: "es" },
  { code: "MX", name: "México", flag: "🇲🇽", timeZone: "America/Mexico_City", group: "es" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", timeZone: "America/Argentina/Buenos_Aires", group: "es" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", timeZone: "America/Bogota", group: "es" },
  { code: "CL", name: "Chile", flag: "🇨🇱", timeZone: "America/Santiago", group: "es" },
  { code: "PE", name: "Perú", flag: "🇵🇪", timeZone: "America/Lima", group: "es" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", timeZone: "America/Caracas", group: "es" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", timeZone: "America/Montevideo", group: "es" },
];

export const DEFAULT_COUNTRY_CODE = "KR";

export function findCountry(code: string): Country {
  return COUNTRIES.find((c) => c.code === code.toUpperCase()) ?? COUNTRIES[0]!;
}

export function isCountryCode(code: string): boolean {
  return COUNTRIES.some((c) => c.code === code.toUpperCase());
}
