import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MetricsView } from "@/components/MetricsView";
import { StateMessage } from "@/components/StateMessage";
import { getMetrics } from "@/lib/api/metrics";
import type { Metrics } from "@/lib/api/types";
import { errorMessageKey } from "@/lib/errors";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return { title: t("title") };
}

export default async function DashboardPage() {
  const t = await getTranslations();
  let metrics: Metrics | null = null;
  let errorKey: string | null = null;
  try {
    metrics = await getMetrics();
  } catch (error) {
    errorKey = errorMessageKey(error);
  }

  return (
    <>
      <header className="page-header">
        <h1>{t("dashboard.title")}</h1>
        <p className="muted">{t("dashboard.subtitle")}</p>
      </header>
      {metrics ? (
        <MetricsView metrics={metrics} />
      ) : (
        <StateMessage
          variant="error"
          title={t("dashboard.errorTitle")}
          description={t(errorKey ?? "errors.generic")}
        />
      )}
    </>
  );
}
