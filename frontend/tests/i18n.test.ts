import { describe, expect, it } from "vitest";

import { defaultLocale, isLocale, resolveLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import ptBR from "@/messages/pt-BR.json";

function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "object" && v !== null ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe("i18n", () => {
  it("defaults to Brazilian Portuguese", () => {
    expect(defaultLocale).toBe("pt-BR");
    expect(resolveLocale(undefined, undefined)).toBe("pt-BR");
    expect(resolveLocale(null, "fr-FR,de;q=0.8")).toBe("pt-BR");
  });

  it("honors the cookie first, then Accept-Language", () => {
    expect(resolveLocale("en", "pt-BR")).toBe("en");
    expect(resolveLocale("xx", "en-US,en;q=0.9")).toBe("en");
    expect(resolveLocale(undefined, "pt-PT;q=1, en;q=0.5")).toBe("pt-BR");
  });

  it("validates locales", () => {
    expect(isLocale("pt-BR")).toBe(true);
    expect(isLocale("es")).toBe(false);
  });

  it("keeps both message catalogs in sync (same keys)", () => {
    expect(keys(en).sort()).toEqual(keys(ptBR).sort());
  });

  it("has a translation for every backend error code", () => {
    for (const code of ["ticket_not_found", "validation_error", "read_only_mode", "metrics_unavailable"]) {
      expect(ptBR.errors).toHaveProperty(code);
      expect(en.errors).toHaveProperty(code);
    }
  });
});
