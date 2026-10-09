import { useTranslations } from "next-intl";

export function ReadOnlyBanner() {
  const t = useTranslations("readOnly");
  return (
    <div className="alert alert-warning border shadow-sm mt-2" role="note" data-testid="read-only-banner">
      <p className="fw-semibold mb-1">
        <span aria-hidden="true">🔒 </span>
        {t("title")}
      </p>
      <p className="mb-0">{t("description")}</p>
    </div>
  );
}
