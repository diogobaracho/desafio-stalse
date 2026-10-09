import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";

import type { Ticket } from "@/lib/api/types";

import { PriorityBadge, StatusBadge } from "./Badges";
import styles from "./TicketTable.module.css";

export function TicketTable({ tickets }: { tickets: Ticket[] }) {
  const t = useTranslations("tickets");
  const tChannel = useTranslations("channel");
  const format = useFormatter();

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <caption className="visually-hidden">{t("tableCaption")}</caption>
        <thead>
          <tr>
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
              <td className={styles.nowrap}>
                <time dateTime={ticket.created_at}>
                  {format.dateTime(new Date(ticket.created_at), { dateStyle: "short", timeStyle: "short" })}
                </time>
              </td>
              <td>{ticket.customer_name}</td>
              <td>{tChannel(ticket.channel)}</td>
              <td>
                <Link
                  href={`/tickets/${ticket.id}`}
                  className={styles.subject}
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
  );
}
