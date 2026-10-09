import { useLocale, useTranslations } from "next-intl";

import { type Brand, localized } from "@/lib/brand/schema";

export function SiteFooter({ brand }: { brand: Brand }) {
  const t = useTranslations("footer");
  const locale = useLocale();
  const { contact } = brand;
  const hours = localized(contact.hours, locale);

  return (
    <footer className="mt-auto bg-white border-top">
      <div className="container py-4">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h2 className="h5 mb-3">{t("contact")}</h2>
            <address className="d-flex flex-wrap gap-2 gap-md-4 mb-3 text-body fst-normal">
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
              <ul className="list-unstyled d-flex flex-wrap gap-3 mb-3">
            {brand.social.map((s) => (
              <li key={s.url}>
                <a href={s.url} rel="noopener noreferrer" target="_blank">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        )}
            <p className="text-muted small mb-0">
          {t("rights", { year: new Date().getFullYear(), company: brand.companyName })}
        </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
