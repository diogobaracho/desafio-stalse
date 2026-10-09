export const locales = ["pt-BR", "en"] as const;
export type Locale = (typeof locales)[number];

/** Brazilian Portuguese is the product's primary language (ADR-0010). */
export const defaultLocale: Locale = "pt-BR";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/**
 * Cookie (explicit user choice) wins; otherwise the first supported Accept-Language entry;
 * otherwise pt-BR.
 */
export function resolveLocale(cookieValue?: string | null, acceptLanguage?: string | null): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  for (const part of (acceptLanguage ?? "").split(",")) {
    const tag = part.split(";")[0]?.trim().toLowerCase();
    if (!tag) continue;
    if (tag.startsWith("pt")) return "pt-BR";
    if (tag.startsWith("en")) return "en";
  }
  return defaultLocale;
}
