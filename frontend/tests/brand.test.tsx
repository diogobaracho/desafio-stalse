import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import defaultBrand from "@/config/brand.default.json";
import { loadBrandFrom } from "@/lib/brand/load";
import { type Brand, brandSchema, localized } from "@/lib/brand/schema";

import { renderWithIntl } from "./render";

const acme: Brand = brandSchema.parse({
  ...defaultBrand,
  productName: "Acme Help Desk",
  companyName: "Acme Ltda",
  tagline: { "pt-BR": "Suporte Acme", en: "Acme support" },
  logo: { src: "https://cdn.acme.test/logo.png", alt: "Acme" },
  contact: { email: "help@acme.test", phone: "+55 21 3000-1234", website: "https://acme.test" },
  social: [{ label: "LinkedIn", url: "https://linkedin.com/company/acme" }],
});

function writeTemp(content: string): string {
  const path = join(mkdtempSync(join(tmpdir(), "brand-")), "brand.json");
  writeFileSync(path, content);
  return path;
}

describe("white-label brand config", () => {
  it("ships a valid default brand", () => {
    expect(() => brandSchema.parse(defaultBrand)).not.toThrow();
    expect(loadBrandFrom(undefined).productName).toBe(defaultBrand.productName);
  });

  it("loads a brand file from BRAND_CONFIG_PATH", () => {
    expect(loadBrandFrom(writeTemp(JSON.stringify(acme))).companyName).toBe("Acme Ltda");
  });

  it("falls back to the default brand when the file is invalid", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const brand = loadBrandFrom(writeTemp(JSON.stringify({ productName: "" })));

    expect(brand.productName).toBe(defaultBrand.productName);
    expect(error).toHaveBeenCalledWith(expect.stringContaining("Invalid brand config"), expect.anything());
  });

  it("rejects invalid colors and contact data", () => {
    const bad = { ...defaultBrand, colors: { ...defaultBrand.colors, primary: "blue" } };
    expect(brandSchema.safeParse(bad).success).toBe(false);
    expect(brandSchema.safeParse({ ...defaultBrand, contact: { email: "nope" } }).success).toBe(false);
  });

  it("localizes brand texts with a pt-BR fallback", () => {
    expect(localized({ "pt-BR": "Olá", en: "Hi" }, "en")).toBe("Hi");
    expect(localized({ "pt-BR": "Olá" }, "en")).toBe("Olá");
    expect(localized({ es: "Hola" }, "en")).toBe("Hola");
    expect(localized(undefined, "en")).toBeUndefined();
  });

  it("renders brand name and contact info only from the config", () => {
    renderWithIntl(
      <>
        <SiteHeader brand={acme} />
        <SiteFooter brand={acme} />
      </>,
    );

    expect(screen.getByRole("link", { name: /Acme Help Desk/ })).toHaveAttribute("href", "/tickets");
    expect(screen.getByText("Suporte Acme")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "help@acme.test" })).toHaveAttribute(
      "href",
      "mailto:help@acme.test",
    );
    expect(screen.getByRole("link", { name: "+55 21 3000-1234" })).toHaveAttribute(
      "href",
      "tel:+552130001234",
    );
    expect(screen.getByRole("link", { name: "acme.test" })).toHaveAttribute("href", "https://acme.test");
    expect(screen.getByRole("link", { name: "LinkedIn" })).toBeInTheDocument();
    expect(screen.getByText(/Acme Ltda\. Todos os direitos reservados\./)).toBeInTheDocument();
    expect(screen.queryByText(/Stalse/)).not.toBeInTheDocument();
  });
});
