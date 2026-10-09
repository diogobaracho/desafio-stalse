"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useState } from "react";

import { listTickets } from "@/lib/api/tickets";
import type { Ticket } from "@/lib/api/types";
import { errorMessageKey } from "@/lib/errors";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

import { StateMessage } from "./StateMessage";
import { TicketTable } from "./TicketTable";

export const SEARCH_DEBOUNCE_MS = 300;

type Result = { kind: "error"; messageKey: string } | { kind: "ready"; tickets: Ticket[] };
type State = { kind: "loading" } | Result;

/** Ticket list with server-side (API) search, debounced; stale responses are aborted. */
export function TicketsView() {
  const t = useTranslations();
  const searchId = useId();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [attempt, setAttempt] = useState(0);
  // Each result remembers the query it answers; a mismatch with the current query = loading.
  const queryKey = `${attempt}:${debouncedSearch}`;
  const [result, setResult] = useState<{ key: string; value: Result } | null>(null);
  const state: State = result?.key === queryKey ? result.value : { kind: "loading" };

  useEffect(() => {
    const controller = new AbortController();
    listTickets(debouncedSearch, controller.signal)
      .then((tickets) => setResult({ key: queryKey, value: { kind: "ready", tickets } }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({ key: queryKey, value: { kind: "error", messageKey: errorMessageKey(error) } });
      });
    return () => controller.abort();
  }, [debouncedSearch, queryKey]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return (
    <section aria-labelledby={`${searchId}-results`} className="pb-4">
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="row g-4 align-items-end">
            <div className="col-12 col-lg-8">
              <h2 className="h3 mb-2">{t("tickets.title")}</h2>
              <p className="text-muted mb-0">{t("tickets.searchHint")}</p>
            </div>
            <div className="col-12 col-lg-4">
              <div className="form-floating">
        <input
          id={searchId}
          className="form-control"
          type="search"
          value={search}
          placeholder={t("tickets.searchPlaceholder")}
          onChange={(event) => setSearch(event.target.value)}
          aria-describedby={`${searchId}-hint`}
          autoComplete="off"
        />
                <label htmlFor={searchId}>{t("tickets.searchLabel")}</label>
              </div>
        <small id={`${searchId}-hint`} className="form-text">
          {t("tickets.searchHint")}
        </small>
            </div>
          </div>
        </div>
      </div>

      <h2 id={`${searchId}-results`} className="visually-hidden">
        {t("tickets.tableCaption")}
      </h2>

      {state.kind === "loading" && <StateMessage variant="loading" title={t("tickets.loading")} />}

      {state.kind === "error" && (
        <StateMessage
          variant="error"
          title={t("tickets.errorTitle")}
          description={t(state.messageKey)}
          action={
            <button type="button" className="btn btn-outline-primary rounded-pill" onClick={retry}>
              {t("common.retry")}
            </button>
          }
        />
      )}

      {state.kind === "ready" && (
        <>
          <p className="text-muted small mb-3" role="status" aria-live="polite">
            {t("tickets.resultsCount", { count: state.tickets.length })}
          </p>
          {state.tickets.length === 0 ? (
            <StateMessage
              variant="empty"
              title={debouncedSearch.trim() ? t("tickets.emptyTitle") : t("tickets.emptyInbox")}
              description={debouncedSearch.trim() ? t("tickets.emptyDescription") : undefined}
            />
          ) : (
            <TicketTable tickets={state.tickets} />
          )}
        </>
      )}
    </section>
  );
}
