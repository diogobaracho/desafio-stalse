import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import { ReadOnlyBanner } from "@/components/ReadOnlyBanner";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isReadOnly } from "@/lib/api/health";
import { getBrand } from "@/lib/brand/load";
import { localized } from "@/lib/brand/schema";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const brand = getBrand();
  const locale = await getLocale();
  return {
    title: { default: brand.productName, template: `%s · ${brand.productName}` },
    description: localized(brand.tagline, locale),
    icons: brand.favicon ? { icon: brand.favicon } : undefined,
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const brand = getBrand();
  const [locale, t, readOnly] = await Promise.all([getLocale(), getTranslations("common"), isReadOnly()]);

  const brandVars = {
    "--brand-primary": brand.colors.primary,
    "--brand-primary-contrast": brand.colors.primaryContrast,
    "--brand-accent": brand.colors.accent,
  } as CSSProperties;

  return (
    <html lang={locale}>
      <body style={brandVars}>
        <NextIntlClientProvider>
          <a href="#main" className="skip-link">
            {t("skipToContent")}
          </a>
          <SiteHeader brand={brand} />
          <main id="main" className="container" style={{ paddingBottom: "2rem" }}>
            {readOnly && <ReadOnlyBanner />}
            {children}
          </main>
          <SiteFooter brand={brand} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
