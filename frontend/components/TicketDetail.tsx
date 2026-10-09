"use client";

import { useFormatter, useTranslations } from "next-intl";
import { type FormEvent, useId, useRef, useState } from "react";

import { updateTicket } from "@/lib/api/tickets";
import {
  type Ticket,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketPriority,
  type TicketStatus,
  type TicketUpdate,
} from "@/lib/api/types";
import { errorMessageKey } from "@/lib/errors";

import { PriorityBadge, StatusBadge } from "./Badges";
import styles from "./TicketDetail.module.css";

type Feedback = { kind: "success" | "failure" | "info"; text: string } | null;

interface Props {
  initialTicket: Ticket;
  readOnly: boolean;
}

/**
 * Shows a ticket and its triage controls. After a successful PATCH the *server-confirmed*
 * ticket replaces local state, so the page always reflects what was persisted.
 */
export function TicketDetail({ initialTicket, readOnly }: Props) {
  const t = useTranslations();
  const format = useFormatter();
  const formId = useId();
  const [ticket, setTicket] = useState(initialTicket);
  const [status, setStatus] = useState<TicketStatus>(initialTicket.status);
  const [priority, setPriority] = useState<TicketPriority>(initialTicket.priority);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const inFlight = useRef(false);

  const formatDate = (iso: string) =>
    format.dateTime(new Date(iso), { dateStyle: "medium", timeStyle: "short" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || readOnly) return; // guards double submits before re-render

    const update: TicketUpdate = {};
    if (status !== ticket.status) update.status = status;
    if (priority !== ticket.priority) update.priority = priority;
    if (Object.keys(update).length === 0) {
      setFeedback({ kind: "info", text: t("ticket.noChanges") });
      return;
    }

    inFlight.current = true;
    setSaving(true);
    setFeedback(null);
    try {
      const saved = await updateTicket(ticket.id, update);
      setTicket(saved);
      setStatus(saved.status);
      setPriority(saved.priority);
      setFeedback({
        kind: "success",
        text: t("ticket.saved", {
          status: t(`status.${saved.status}`),
          priority: t(`priority.${saved.priority}`),
        }),
      });
    } catch (error) {
      setFeedback({ kind: "failure", text: t("ticket.saveFailed", { reason: t(errorMessageKey(error)) }) });
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  const disabled = readOnly || saving;

  return (
    <div className={styles.grid}>
      <section className="card" aria-labelledby={`${formId}-details`}>
        <h2 id={`${formId}-details`}>{t("ticket.details")}</h2>
        <dl className={styles.fields}>
          <dt>{t("ticket.fields.id")}</dt>
          <dd>#{ticket.id}</dd>
          <dt>{t("ticket.fields.customer")}</dt>
          <dd>{ticket.customer_name}</dd>
          <dt>{t("ticket.fields.channel")}</dt>
          <dd>{t(`channel.${ticket.channel}`)}</dd>
          <dt>{t("ticket.fields.subject")}</dt>
          <dd>{ticket.subject}</dd>
          <dt>{t("ticket.fields.status")}</dt>
          <dd data-testid="current-status">
            <StatusBadge status={ticket.status} />
          </dd>
          <dt>{t("ticket.fields.priority")}</dt>
          <dd data-testid="current-priority">
            <PriorityBadge priority={ticket.priority} />
          </dd>
          <dt>{t("ticket.fields.createdAt")}</dt>
          <dd>
            <time dateTime={ticket.created_at}>{formatDate(ticket.created_at)}</time>
          </dd>
          <dt>{t("ticket.fields.updatedAt")}</dt>
          <dd>
            <time dateTime={ticket.updated_at}>{formatDate(ticket.updated_at)}</time>
          </dd>
          <dt>{t("ticket.fields.description")}</dt>
          <dd className={styles.description}>{ticket.description}</dd>
        </dl>
      </section>

      <section className="card" aria-labelledby={`${formId}-triage`}>
        <h2 id={`${formId}-triage`}>{t("ticket.triage")}</h2>
        <p className="muted">{t("ticket.triageHint")}</p>
        <form className={styles.form} onSubmit={handleSubmit} aria-busy={saving}>
          <div className="field">
            <label htmlFor={`${formId}-status`}>{t("ticket.fields.status")}</label>
            <select
              id={`${formId}-status`}
              className="select"
              value={status}
              disabled={disabled}
              onChange={(event) => setStatus(event.target.value as TicketStatus)}
            >
              {TICKET_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {t(`status.${value}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`${formId}-priority`}>{t("ticket.fields.priority")}</label>
            <select
              id={`${formId}-priority`}
              className="select"
              value={priority}
              disabled={disabled}
              onChange={(event) => setPriority(event.target.value as TicketPriority)}
            >
              {TICKET_PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {t(`priority.${value}`)}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="button" disabled={disabled}>
            {saving ? t("ticket.saving") : t("ticket.save")}
          </button>
          <p
            role="status"
            aria-live="polite"
            className={`${styles.feedback} ${feedback ? styles[feedback.kind] : ""}`}
          >
            {feedback?.text}
          </p>
        </form>
      </section>
    </div>
  );
}
