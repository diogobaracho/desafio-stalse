import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";

import type { Ticket } from "@/lib/api/types";

import { PriorityBadge, StatusBadge } from "./Badges";

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
          <tr className="text-uppercase small text-muted">
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
            <tr key={ticket.id}>
              <td className="text-nowrap">
                <time dateTime={ticket.created_at}>
                  {format.dateTime(new Date(ticket.created_at), { dateStyle: "short", timeStyle: "short" })}
                </time>
              </td>
              <td>{ticket.customer_name}</td>
              <td>{tChannel(ticket.channel)}</td>
              <td>
                <Link
                  href={`/tickets/${ticket.id}`}
                  className="fw-semibold link-primary text-decoration-none"
                  aria-label={t("openTicket", { id: ticket.id, subject: ticket.subject })}
                >
                  {ticket.subject}
                </Link>
              </td>
              <td>
                <StatusBadge status={ticket.status} />
              </td>
              <td>
                <PriorityBadge priority={ticket.priority} />
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
}
