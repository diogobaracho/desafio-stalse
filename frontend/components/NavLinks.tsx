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
    <ul>
      {LINKS.map(({ href, key }) => (
        <li key={href}>
          <Link href={href} aria-current={pathname.startsWith(href) ? "page" : undefined}>
            {t(key)}
          </Link>
        </li>
      ))}
    </ul>
  );
}
