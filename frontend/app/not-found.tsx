import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations();
  return (
    <div className="py-4">
      <h1 className="display-6 mb-2">{t("notFound.title")}</h1>
      <p className="lead mb-4">{t("notFound.description")}</p>
      <Link href="/tickets" className="btn btn-outline-primary rounded-pill">
        ← {t("common.backToList")}
      </Link>
    </div>
  );
}
