import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { type Brand, localized } from "@/lib/brand/schema";

import { LanguageSwitcher } from "./LanguageSwitcher";
import { NavLinks } from "./NavLinks";

export function SiteHeader({ brand }: { brand: Brand }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const tagline = localized(brand.tagline, locale);

  return (
    <header className="bg-white border-bottom sticky-top">
      <div className="container py-3">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-lg-4">
            <Link href="/tickets" className="d-inline-flex align-items-center gap-2 text-decoration-none text-dark">
          {/* Plain <img>: the logo may be any absolute URL from the white-label config. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brand.logo.src} alt="" width={36} height={36} className="rounded-circle border" />
              <span className="d-block lh-base">
                <span className="fw-semibold fs-5">{brand.productName}</span>
                {tagline && <span className="d-block small text-muted">{tagline}</span>}
              </span>
            </Link>
          </div>
          <div className="col-12 col-lg-8">
            <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-end gap-3">
              <nav aria-label={t("label")}>
            <NavLinks />
          </nav>
          <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
