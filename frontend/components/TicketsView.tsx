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
    <section aria-labelledby={`${searchId}-results`}>
      <div className="field" style={{ maxWidth: 420, marginBottom: "1rem" }}>
        <label htmlFor={searchId}>{t("tickets.searchLabel")}</label>
        <input
          id={searchId}
          className="input"
          type="search"
          value={search}
          placeholder={t("tickets.searchPlaceholder")}
          onChange={(event) => setSearch(event.target.value)}
          aria-describedby={`${searchId}-hint`}
          autoComplete="off"
        />
        <small id={`${searchId}-hint`} className="muted">
          {t("tickets.searchHint")}
        </small>
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
            <button type="button" className="button button-secondary" onClick={retry}>
              {t("common.retry")}
            </button>
          }
        />
      )}

      {state.kind === "ready" && (
        <>
          <p className="muted" role="status" aria-live="polite">
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
