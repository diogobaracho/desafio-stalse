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
      <section className="container-fluid px-0 mb-3 mb-sm-4">
        <div className="row g-0">
          <div className="col-12">
            <div className="card border-0 shadow-sm bg-success-subtle">
              <div className="card-body p-3 p-sm-4 p-lg-5">
                <h1 className="display-6 mb-2 text-break">{t("dashboard.title")}</h1>
                <p className="lead mb-0">{t("dashboard.subtitle")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
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
