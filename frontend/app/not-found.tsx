import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations();
  return (
    <div className="page-header">
      <h1>{t("notFound.title")}</h1>
      <p className="muted">{t("notFound.description")}</p>
      <Link href="/tickets">← {t("common.backToList")}</Link>
    </div>
  );
}
