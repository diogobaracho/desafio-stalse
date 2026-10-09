import type { Metadata } from "next";
import type { ReactNode } from "react";
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

  return (
    <html lang={locale}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-light text-dark d-flex flex-column min-vh-100">
        <NextIntlClientProvider>
          <a href="#main" className="visually-hidden-focusable m-3 d-inline-block">
            {t("skipToContent")}
          </a>
          <SiteHeader brand={brand} />
          <main id="main" className="container flex-grow-1 py-4 pb-5">
            {readOnly && <ReadOnlyBanner />}
            {children}
          </main>
          <SiteFooter brand={brand} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
