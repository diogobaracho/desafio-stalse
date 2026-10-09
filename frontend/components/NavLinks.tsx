"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const LINKS = [
  { href: "/tickets", key: "tickets" },
  { href: "/dashboard", key: "dashboard" },
] as const;

export function NavLinks() {
  const t = useTranslations("nav");
  const pathname = usePathname() ?? "";
  return (
    <ul className="nav nav-pills gap-2">
      {LINKS.map(({ href, key }) => (
        <li key={href} className="nav-item">
          <Link
            href={href}
            className={`nav-link rounded-pill px-3 ${pathname.startsWith(href) ? "active" : "text-primary"}`}
            aria-current={pathname.startsWith(href) ? "page" : undefined}
          >
            {t(key)}
          </Link>
        </li>
      ))}
    </ul>
  );
}
