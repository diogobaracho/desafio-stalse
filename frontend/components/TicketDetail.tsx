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
    <div className="row g-4">
      <section className="col-12 col-lg-8" aria-labelledby={`${formId}-details`}>
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body p-4 p-lg-5">
            <h2 id={`${formId}-details`} className="h3 mb-4">
              {t("ticket.details")}
            </h2>
            <dl className="row g-3 mb-0">
          <dt>{t("ticket.fields.id")}</dt>
          <dd className="col-sm-8">#{ticket.id}</dd>
          <dt className="col-sm-4 text-muted">{t("ticket.fields.customer")}</dt>
          <dd className="col-sm-8">{ticket.customer_name}</dd>
          <dt className="col-sm-4 text-muted">{t("ticket.fields.channel")}</dt>
          <dd className="col-sm-8">{t(`channel.${ticket.channel}`)}</dd>
          <dt className="col-sm-4 text-muted">{t("ticket.fields.subject")}</dt>
          <dd className="col-sm-8">{ticket.subject}</dd>
          <dt className="col-sm-4 text-muted">{t("ticket.fields.status")}</dt>
          <dd className="col-sm-8" data-testid="current-status">
            <StatusBadge status={ticket.status} />
          </dd>
          <dt className="col-sm-4 text-muted">{t("ticket.fields.priority")}</dt>
          <dd className="col-sm-8" data-testid="current-priority">
            <PriorityBadge priority={ticket.priority} />
          </dd>
          <dt className="col-sm-4 text-muted">{t("ticket.fields.createdAt")}</dt>
          <dd className="col-sm-8">
            <time dateTime={ticket.created_at}>{formatDate(ticket.created_at)}</time>
          </dd>
          <dt className="col-sm-4 text-muted">{t("ticket.fields.updatedAt")}</dt>
          <dd className="col-sm-8">
            <time dateTime={ticket.updated_at}>{formatDate(ticket.updated_at)}</time>
          </dd>
          <dt className="col-sm-4 text-muted">{t("ticket.fields.description")}</dt>
          <dd className="col-sm-8 mb-0">{ticket.description}</dd>
        </dl>
          </div>
        </div>
      </section>

      <section className="col-12 col-lg-4" aria-labelledby={`${formId}-triage`}>
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body p-4">
            <h2 id={`${formId}-triage`} className="h4 mb-3">
              {t("ticket.triage")}
            </h2>
            <div className="alert alert-info mb-4">{t("ticket.triageHint")}</div>
            <form className="d-grid gap-3" onSubmit={handleSubmit} aria-busy={saving}>
              <div className="form-floating">
            <select
              id={`${formId}-status`}
              className="form-select"
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
                <label htmlFor={`${formId}-status`}>{t("ticket.fields.status")}</label>
              </div>
              <div className="form-floating">
            <select
              id={`${formId}-priority`}
              className="form-select"
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
                <label htmlFor={`${formId}-priority`}>{t("ticket.fields.priority")}</label>
              </div>
              <button type="submit" className="btn btn-success rounded-pill px-4" disabled={disabled}>
            {saving ? t("ticket.saving") : t("ticket.save")}
          </button>
          <p
            role="status"
            aria-live="polite"
                className={`small mb-0 ${
                  feedback?.kind === "success"
                    ? "text-success"
                    : feedback?.kind === "failure"
                      ? "text-danger"
                      : "text-primary"
                }`}
          >
            {feedback?.text}
          </p>
        </form>
          </div>
        </div>
      </section>
    </div>
  );
}
