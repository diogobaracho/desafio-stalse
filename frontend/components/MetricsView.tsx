import { useFormatter, useTranslations } from "next-intl";

import type { Metrics } from "@/lib/api/types";

import { StateMessage } from "./StateMessage";

function BreakdownTable({
  title,
  rows,
  total,
  labelHeader,
  scrollable = false,
}: {
  title: string;
  rows: [string, number][];
  total: number;
  labelHeader: string;
  scrollable?: boolean;
}) {
  const t = useTranslations("dashboard");
  const format = useFormatter();
  const headingId = `metrics-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <section className="card border-0 shadow-sm h-100" aria-labelledby={headingId}>
      <div className="card-body">
        <h2 id={headingId} className="h4 mb-3">
          {title}
        </h2>
        <div className={scrollable ? "table-responsive" : undefined}>
          <table className="table table-sm align-middle mb-0">
          <thead>
            <tr className="text-muted">
              <th scope="col">{labelHeader}</th>
              <th scope="col">{t("count")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, count]) => {
              const share = total > 0 ? count / total : 0;
              return (
                <tr key={label}>
                  <th scope="row" className="fw-normal">
                    {label}
                  </th>
                  <td>
                    {format.number(count)}
                    <span className="visually-hidden">
                      {" "}
                      ({t("share", { percent: format.number(share, { style: "percent" }) })})
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/** Pure presentation of the ETL output. Works as a server or client component. */
export function MetricsView({ metrics }: { metrics: Metrics }) {
  const t = useTranslations("dashboard");
  const format = useFormatter();

  if (metrics.total_records === 0) {
    return <StateMessage variant="empty" title={t("emptyTitle")} description={t("emptyDescription")} />;
  }

  const formatDay = (day: string) =>
    format.dateTime(new Date(`${day}T00:00:00Z`), { dateStyle: "medium", timeZone: "UTC" });
  const total = metrics.total_records;

  return (
    <>
      <p className="alert alert-primary border shadow-sm d-flex gap-2 mb-4" data-testid="metrics-provenance">
        <span aria-hidden="true">ⓘ</span>{" "}
        {t("provenance", {
          file: metrics.source.file,
          generatedAt: metrics.generated_at
            ? format.dateTime(new Date(metrics.generated_at), { dateStyle: "medium", timeZone: "UTC" })
            : "—",
        })}
      </p>

      <ul className="row g-3 list-unstyled mb-4">
        <li className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100 bg-light">
            <div className="card-body">
              <p className="text-muted mb-1">{t("totalRecords")}</p>
              <p className="display-6 mb-0">{format.number(total)}</p>
            </div>
          </div>
        </li>
        <li className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100 bg-light">
            <div className="card-body">
              <p className="text-muted mb-1">{t("rowsRead")}</p>
              <p className="display-6 mb-0">{format.number(metrics.source.rows_read)}</p>
            </div>
          </div>
        </li>
        <li className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100 bg-light">
            <div className="card-body">
              <p className="text-muted mb-1">{t("invalidDates")}</p>
              <p className="display-6 mb-0">{format.number(metrics.invalid_dates_dropped)}</p>
            </div>
          </div>
        </li>
        {metrics.date_range.start && metrics.date_range.end && (
          <li className="col-12 col-sm-6 col-xl-3">
            <div className="card border-0 shadow-sm h-100 bg-light">
              <div className="card-body">
                <p className="text-muted mb-1">{t("period")}</p>
                <p className="lead mb-0">
              {t("periodValue", {
                start: formatDay(metrics.date_range.start),
                end: formatDay(metrics.date_range.end),
              })}
                </p>
              </div>
            </div>
          </li>
        )}
      </ul>

      <div className="row g-3">
        <div className="col-12 col-xl-6">
        <BreakdownTable
          title={t("topCategories")}
          labelHeader={t("label")}
          total={total}
          rows={metrics.top_categories.map((c) => [c.category, c.count])}
        />
        </div>
        <div className="col-12 col-xl-6">
        <BreakdownTable
          title={t("byChannel")}
          labelHeader={t("label")}
          total={total}
          rows={Object.entries(metrics.by_channel)}
        />
        </div>
        <div className="col-12 col-xl-6">
        <BreakdownTable
          title={t("byPriority")}
          labelHeader={t("label")}
          total={total}
          rows={Object.entries(metrics.by_priority)}
        />
        </div>
        {metrics.by_status && (
          <div className="col-12 col-xl-6">
          <BreakdownTable
            title={t("byStatus")}
            labelHeader={t("label")}
            total={total}
            rows={Object.entries(metrics.by_status)}
          />
          </div>
        )}
        <div className="col-12">
        <BreakdownTable
          title={t("recordsByDay")}
          labelHeader={t("day")}
          total={total}
          scrollable
          rows={Object.entries(metrics.records_by_day).map(([day, n]) => [formatDay(day), n])}
        />
        </div>
      </div>
    </>
  );
}
