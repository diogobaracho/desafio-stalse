"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { StateMessage } from "@/components/StateMessage";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="page-header">
      <h1>{t("errorPage.title")}</h1>
      <StateMessage
        variant="error"
        title={t("errorPage.title")}
        description={t("errorPage.description")}
        action={
          <button type="button" className="button button-secondary" onClick={reset}>
            {t("common.retry")}
          </button>
        }
      />
    </div>
  );
}
