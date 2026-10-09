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

interface ChoiceButtonsProps<T extends string> {
  legend: string;
  options: { value: T; label: string }[];
  selected: T;
  disabled: boolean;
  onSelect: (value: T) => void;
}

/** One toggle button per allowed value; the pending choice is marked with aria-pressed. */
function ChoiceButtons<T extends string>({
  legend,
  options,
  selected,
  disabled,
  onSelect,
}: ChoiceButtonsProps<T>) {
  return (
    <fieldset className="mb-0">
      <legend className="form-label fs-6 text-muted mb-2">{legend}</legend>
      <div className="btn-group w-100 flex-wrap">
        {options.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`btn ${value === selected ? "btn-primary" : "btn-outline-primary"}`}
            aria-pressed={value === selected}
            disabled={disabled}
            onClick={() => onSelect(value)}
          >
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  );
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
          <div className="card-body p-3 p-sm-4 p-lg-5">
            <h2 id={`${formId}-details`} className="h3 mb-3 mb-sm-4">
              {t("ticket.details")}
            </h2>
            <dl className="row mb-0">
              <dt className="col-sm-4 text-muted">{t("ticket.fields.id")}</dt>
              <dd className="col-sm-8 mb-3 mb-sm-2 text-break">#{ticket.id}</dd>
              <dt className="col-sm-4 text-muted">{t("ticket.fields.customer")}</dt>
              <dd className="col-sm-8 mb-3 mb-sm-2 text-break">{ticket.customer_name}</dd>
              <dt className="col-sm-4 text-muted">{t("ticket.fields.channel")}</dt>
              <dd className="col-sm-8 mb-3 mb-sm-2 text-break">{t(`channel.${ticket.channel}`)}</dd>
              <dt className="col-sm-4 text-muted">{t("ticket.fields.subject")}</dt>
              <dd className="col-sm-8 mb-3 mb-sm-2 text-break">{ticket.subject}</dd>
              <dt className="col-sm-4 text-muted">{t("ticket.fields.status")}</dt>
              <dd className="col-sm-8 mb-3 mb-sm-2 text-break" data-testid="current-status">
                <StatusBadge status={ticket.status} />
              </dd>
              <dt className="col-sm-4 text-muted">{t("ticket.fields.priority")}</dt>
              <dd className="col-sm-8 mb-3 mb-sm-2 text-break" data-testid="current-priority">
                <PriorityBadge priority={ticket.priority} />
              </dd>
              <dt className="col-sm-4 text-muted">{t("ticket.fields.createdAt")}</dt>
              <dd className="col-sm-8 mb-3 mb-sm-2 text-break">
                <time dateTime={ticket.created_at}>{formatDate(ticket.created_at)}</time>
              </dd>
              <dt className="col-sm-4 text-muted">{t("ticket.fields.updatedAt")}</dt>
              <dd className="col-sm-8 mb-3 mb-sm-2 text-break">
                <time dateTime={ticket.updated_at}>{formatDate(ticket.updated_at)}</time>
              </dd>
              <dt className="col-sm-4 text-muted">{t("ticket.fields.description")}</dt>
              <dd className="col-sm-8 mb-0 text-break">{ticket.description}</dd>
            </dl>
          </div>
        </div>
      </section>

      <section className="col-12 col-lg-4" aria-labelledby={`${formId}-triage`}>
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body p-3 p-sm-4">
            <h2 id={`${formId}-triage`} className="h4 mb-3">
              {t("ticket.triage")}
            </h2>
            <div className="alert alert-info mb-3 mb-sm-4">{t("ticket.triageHint")}</div>
            <form className="d-grid gap-3" onSubmit={handleSubmit} aria-busy={saving}>
              <ChoiceButtons
                legend={t("ticket.fields.status")}
                options={TICKET_STATUSES.map((value) => ({ value, label: t(`status.${value}`) }))}
                selected={status}
                disabled={disabled}
                onSelect={setStatus}
              />
              <ChoiceButtons
                legend={t("ticket.fields.priority")}
                options={TICKET_PRIORITIES.map((value) => ({ value, label: t(`priority.${value}`) }))}
                selected={priority}
                disabled={disabled}
                onSelect={setPriority}
              />
              <button type="submit" className="btn btn-success rounded-pill px-4 py-2" disabled={disabled}>
                {saving ? t("ticket.saving") : t("ticket.save")}
              </button>
              <p
                role="status"
                aria-live="polite"
                className={`small mb-0 text-break ${
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
