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
    <header className="bg-white border-bottom sticky-md-top">
      <div className="container py-2 py-sm-3">
        {/* xs: brand / nav / language stacked (not sticky, to keep the viewport for content);
            sm: brand | language, nav below; lg: brand | nav | language. */}
        <div className="row g-2 g-lg-3 align-items-center">
          <div className="col-12 col-sm">
            <Link
              href="/tickets"
              aria-label={brand.productName}
              className="d-inline-flex align-items-center gap-2 text-decoration-none text-dark"
            >
              {/* Plain <img>: the logo may be any absolute URL from the white-label config. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brand.logo.src}
                alt=""
                width={36}
                height={36}
                className="rounded-circle border flex-shrink-0"
              />
              {/* Hidden below 360px by app/globals.css (Bootstrap has no breakpoint that small). */}
              <span className="brand-text d-block lh-sm">
                <span className="fw-semibold fs-5">{brand.productName}</span>
                {tagline && <span className="d-none d-sm-block small text-muted">{tagline}</span>}
              </span>
            </Link>
          </div>
          <div className="col-12 col-sm-auto order-last order-sm-0 order-lg-last">
            <LanguageSwitcher />
          </div>
          <nav className="col-12 col-lg-auto" aria-label={t("label")}>
            <NavLinks />
          </nav>
        </div>
      </div>
    </header>
  );
}
