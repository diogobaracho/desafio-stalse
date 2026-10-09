import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import type { Ticket } from "@/lib/api/types";

import { PriorityBadge, StatusBadge } from "./Badges";

/**
 * One markup for both layouts: below `md` each row is a flex column ("card") and every cell
 * shows its own label; from `md` up the same elements fall back to a regular table.
 */
function Cell({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`d-flex d-md-table-cell justify-content-between align-items-center gap-3 border-0 py-1 py-md-2 ${className}`}
    >
      <span className="d-md-none text-muted small">{label}</span>
      <span className="text-end text-md-start text-break">{children}</span>
    </td>
  );
}

export function TicketTable({ tickets }: { tickets: Ticket[] }) {
  const t = useTranslations("tickets");
  const tChannel = useTranslations("channel");
  const format = useFormatter();

  return (
    <div className="card shadow-sm border-0">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <caption className="visually-hidden">{t("tableCaption")}</caption>
          <thead>
            <tr className="d-none d-md-table-row text-uppercase small text-muted">
              <th scope="col">{t("columns.createdAt")}</th>
              <th scope="col">{t("columns.customer")}</th>
              <th scope="col">{t("columns.channel")}</th>
              <th scope="col">{t("columns.subject")}</th>
              <th scope="col">{t("columns.status")}</th>
              <th scope="col">{t("columns.priority")}</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                className="d-flex flex-column d-md-table-row position-relative border-bottom px-2 py-2"
              >
                <Cell label={t("columns.createdAt")} className="text-nowrap">
                  <time dateTime={ticket.created_at}>
                    {format.dateTime(new Date(ticket.created_at), { dateStyle: "short", timeStyle: "short" })}
                  </time>
                </Cell>
                <Cell label={t("columns.customer")}>{ticket.customer_name}</Cell>
                <Cell label={t("columns.channel")}>{tChannel(ticket.channel)}</Cell>
                {/* Card title on mobile; the stretched link makes the whole row/card tappable. */}
                <td className="order-first d-block d-md-table-cell border-0 pt-1 pb-2 py-md-2 text-break">
                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="fw-semibold link-primary text-decoration-none stretched-link"
                    aria-label={t("openTicket", { id: ticket.id, subject: ticket.subject })}
                  >
                    {ticket.subject}
                  </Link>
                </td>
                <Cell label={t("columns.status")}>
                  <StatusBadge status={ticket.status} />
                </Cell>
                <Cell label={t("columns.priority")}>
                  <PriorityBadge priority={ticket.priority} />
                </Cell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
