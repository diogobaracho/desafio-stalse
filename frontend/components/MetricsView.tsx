import { useFormatter, useTranslations } from "next-intl";

import type { Metrics } from "@/lib/api/types";

import { StateMessage } from "./StateMessage";
import styles from "./MetricsView.module.css";

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
    <section className="card" aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      <div className={scrollable ? styles.scroll : undefined} tabIndex={scrollable ? 0 : undefined}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{labelHeader}</th>
              <th scope="col">{t("count")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, count]) => {
              const share = total > 0 ? count / total : 0;
              return (
                <tr key={label}>
                  <th scope="row" style={{ fontWeight: 400 }}>
                    {label}
                    {/* Decorative bar; the exact value is in the next cell. */}
                    <span
                      className={styles.bar}
                      style={{ width: `${Math.round(share * 100)}%` }}
                      aria-hidden="true"
                    />
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
      <p className={styles.provenance} data-testid="metrics-provenance">
        <span aria-hidden="true">ⓘ</span>
        {t("provenance", {
          file: metrics.source.file,
          generatedAt: metrics.generated_at
            ? format.dateTime(new Date(metrics.generated_at), { dateStyle: "medium", timeZone: "UTC" })
            : "—",
        })}
      </p>

      <ul className={styles.cards}>
        <li className="card">
          <p className={styles.cardLabel}>{t("totalRecords")}</p>
          <p className={styles.cardValue}>{format.number(total)}</p>
        </li>
        <li className="card">
          <p className={styles.cardLabel}>{t("rowsRead")}</p>
          <p className={styles.cardValue}>{format.number(metrics.source.rows_read)}</p>
        </li>
        <li className="card">
          <p className={styles.cardLabel}>{t("invalidDates")}</p>
          <p className={styles.cardValue}>{format.number(metrics.invalid_dates_dropped)}</p>
        </li>
        {metrics.date_range.start && metrics.date_range.end && (
          <li className="card">
            <p className={styles.cardLabel}>{t("period")}</p>
            <p className={styles.cardValue} style={{ fontSize: "1.1rem" }}>
              {t("periodValue", {
                start: formatDay(metrics.date_range.start),
                end: formatDay(metrics.date_range.end),
              })}
            </p>
          </li>
        )}
      </ul>

      <div className={styles.panels}>
        <BreakdownTable
          title={t("topCategories")}
          labelHeader={t("label")}
          total={total}
          rows={metrics.top_categories.map((c) => [c.category, c.count])}
        />
        <BreakdownTable
          title={t("byChannel")}
          labelHeader={t("label")}
          total={total}
          rows={Object.entries(metrics.by_channel)}
        />
        <BreakdownTable
          title={t("byPriority")}
          labelHeader={t("label")}
          total={total}
          rows={Object.entries(metrics.by_priority)}
        />
        {metrics.by_status && (
          <BreakdownTable
            title={t("byStatus")}
            labelHeader={t("label")}
            total={total}
            rows={Object.entries(metrics.by_status)}
          />
        )}
        <BreakdownTable
          title={t("recordsByDay")}
          labelHeader={t("day")}
          total={total}
          scrollable
          rows={Object.entries(metrics.records_by_day).map(([day, n]) => [formatDay(day), n])}
        />
      </div>
    </>
  );
}
