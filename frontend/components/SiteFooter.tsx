import { useLocale, useTranslations } from "next-intl";

import { type Brand, localized } from "@/lib/brand/schema";

export function SiteFooter({ brand }: { brand: Brand }) {
  const t = useTranslations("footer");
  const locale = useLocale();
  const { contact } = brand;
  const hours = localized(contact.hours, locale);

  return (
    <footer
      style={{
        marginTop: "auto",
        borderTop: "1px solid var(--color-border)",
        background: "var(--color-surface)",
      }}
    >
      <div className="container" style={{ padding: "1.25rem 1rem", display: "grid", gap: "0.5rem" }}>
        <h2 style={{ fontSize: "1rem", margin: 0 }}>{t("contact")}</h2>
        <address style={{ fontStyle: "normal", display: "flex", flexWrap: "wrap", gap: "0.25rem 1.5rem" }}>
          <span>
            {t("email")}: <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </span>
          {contact.phone && (
            <span>
              {t("phone")}: <a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}>{contact.phone}</a>
            </span>
          )}
          {contact.website && (
            <span>
              {t("website")}: <a href={contact.website}>{contact.website.replace(/^https?:\/\//, "")}</a>
            </span>
          )}
          {contact.address && (
            <span>
              {t("address")}: {contact.address}
            </span>
          )}
          {hours && (
            <span>
              {t("hours")}: {hours}
            </span>
          )}
        </address>
        {brand.social.length > 0 && (
          <ul style={{ display: "flex", gap: "1rem", listStyle: "none", margin: 0, padding: 0 }}>
            {brand.social.map((s) => (
              <li key={s.url}>
                <a href={s.url} rel="noopener noreferrer" target="_blank">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        )}
        <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
          {t("rights", { year: new Date().getFullYear(), company: brand.companyName })}
        </p>
      </div>
    </footer>
  );
}
