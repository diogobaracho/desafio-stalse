import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { type Brand, localized } from "@/lib/brand/schema";

import { LanguageSwitcher } from "./LanguageSwitcher";
import { NavLinks } from "./NavLinks";
import styles from "./SiteHeader.module.css";

export function SiteHeader({ brand }: { brand: Brand }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const tagline = localized(brand.tagline, locale);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/tickets" className={styles.brand}>
          {/* Plain <img>: the logo may be any absolute URL from the white-label config. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logo.src} alt="" width={36} height={36} />
          <span>
            {brand.productName}
            {tagline && <span className={styles.tagline}>{tagline}</span>}
          </span>
        </Link>
        <div className={styles.end}>
          <nav aria-label={t("label")} className={styles.nav}>
            <NavLinks />
          </nav>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
