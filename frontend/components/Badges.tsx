import { useTranslations } from "next-intl";

import type { TicketPriority, TicketStatus } from "@/lib/api/types";

import styles from "./Badge.module.css";

const STATUS_ICON: Record<TicketStatus, string> = { open: "○", in_progress: "◐", closed: "●" };
const PRIORITY_ICON: Record<TicketPriority, string> = { low: "▽", medium: "◆", high: "▲" };

export function StatusBadge({ status }: { status: TicketStatus }) {
  const t = useTranslations("status");
  return (
    <span className={`${styles.badge} ${styles[status]}`} data-status={status}>
      <span className={styles.icon} aria-hidden="true">
        {STATUS_ICON[status]}
      </span>
      {t(status)}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const t = useTranslations("priority");
  return (
    <span className={`${styles.badge} ${styles[priority]}`} data-priority={priority}>
      <span className={styles.icon} aria-hidden="true">
        {PRIORITY_ICON[priority]}
      </span>
      {t(priority)}
    </span>
  );
}
