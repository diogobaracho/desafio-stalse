import { useTranslations } from "next-intl";

import type { TicketPriority, TicketStatus } from "@/lib/api/types";

const STATUS_ICON: Record<TicketStatus, string> = { open: "○", in_progress: "◐", closed: "●" };
const PRIORITY_ICON: Record<TicketPriority, string> = { low: "▽", medium: "◆", high: "▲" };
const STATUS_CLASS: Record<TicketStatus, string> = {
  open: "text-bg-primary",
  in_progress: "text-bg-warning",
  closed: "text-bg-secondary",
};
const PRIORITY_CLASS: Record<TicketPriority, string> = {
  low: "text-bg-secondary",
  medium: "text-bg-warning",
  high: "text-bg-danger",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const t = useTranslations("status");
  return (
    <span className={`badge rounded-pill ${STATUS_CLASS[status]}`} data-status={status}>
      <span className="me-1" aria-hidden="true">
        {STATUS_ICON[status]}
      </span>
      {t(status)}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const t = useTranslations("priority");
  return (
    <span className={`badge rounded-pill ${PRIORITY_CLASS[priority]}`} data-priority={priority}>
      <span className="me-1" aria-hidden="true">
        {PRIORITY_ICON[priority]}
      </span>
      {t(priority)}
    </span>
  );
}
