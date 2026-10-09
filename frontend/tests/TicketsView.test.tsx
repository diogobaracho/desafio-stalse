import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { TicketsView } from "@/components/TicketsView";

import { API, tickets } from "./fixtures";
import { errorResponse, server } from "./msw";
import { renderWithIntl } from "./render";

describe("TicketsView", () => {
  it("shows a loading state, then the ticket table with all columns", async () => {
    renderWithIntl(<TicketsView />);

    expect(screen.getByText("Carregando tickets…")).toBeInTheDocument();

    const table = await screen.findByRole("table", { name: "Lista de tickets" });
    const headers = within(table)
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toEqual(["Criado em", "Cliente", "Canal", "Assunto", "Status", "Prioridade"]);
    expect(within(table).getAllByRole("row")).toHaveLength(tickets.length + 1);
    expect(screen.getByText("2 tickets")).toBeInTheDocument();
  });

  it("renders translated enums and links each row to its detail page", async () => {
    renderWithIntl(<TicketsView />);

    const link = await screen.findByRole("link", { name: /Abrir ticket #2/ });
    expect(link).toHaveAttribute("href", "/tickets/2");
    const row = link.closest("tr")!;
    expect(within(row).getByText("Em andamento")).toBeInTheDocument();
    expect(within(row).getByText("Alta")).toBeInTheDocument();
    expect(within(row).getByText("Chat")).toBeInTheDocument();
  });

  it("searches through the API with a debounce (one request per pause)", async () => {
    const searches: (string | null)[] = [];
    server.use(
      http.get(`${API}/tickets`, ({ request }) => {
        const search = new URL(request.url).searchParams.get("search");
        searches.push(search);
        return HttpResponse.json(
          search ? tickets.filter((t) => t.customer_name.includes("Carlos")) : tickets,
        );
      }),
    );
    const user = userEvent.setup();
    renderWithIntl(<TicketsView />);
    await screen.findByRole("table");

    await user.type(screen.getByLabelText("Buscar tickets"), "carlos");

    await waitFor(() => expect(screen.getByText("1 ticket")).toBeInTheDocument());
    expect(searches).toEqual([null, "carlos"]);
    expect(screen.getByText("Carlos Henrique Lima")).toBeInTheDocument();
    expect(screen.queryByText("Mariana Souza")).not.toBeInTheDocument();
  });

  it("shows an empty state when a search has no results", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TicketsView />);
    await screen.findByRole("table");

    await user.type(screen.getByLabelText("Buscar tickets"), "xyz");

    const empty = await screen.findByText("Tente outro termo de busca.");
    expect(empty.closest("[data-state='empty']")).toHaveTextContent("Nenhum ticket encontrado");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows an empty-inbox state when there are no tickets at all", async () => {
    server.use(http.get(`${API}/tickets`, () => HttpResponse.json([])));
    renderWithIntl(<TicketsView />);

    expect(await screen.findByText("A caixa de entrada está vazia.")).toBeInTheDocument();
  });

  it("shows a translated error and recovers on retry", async () => {
    let calls = 0;
    server.use(
      http.get(`${API}/tickets`, async () => {
        calls += 1;
        if (calls === 1) return errorResponse(500, "internal_error");
        await delay(10);
        return HttpResponse.json(tickets);
      }),
    );
    const user = userEvent.setup();
    renderWithIntl(<TicketsView />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Não foi possível carregar os tickets");
    expect(alert).toHaveTextContent("Erro interno do servidor");

    await user.click(within(alert).getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByRole("table")).toBeInTheDocument();
  });

  it("reports a network failure in plain language", async () => {
    server.use(http.get(`${API}/tickets`, () => HttpResponse.error()));
    renderWithIntl(<TicketsView />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar à API");
  });

  it("renders in English when the locale is en", async () => {
    renderWithIntl(<TicketsView />, { locale: "en" });

    expect(await screen.findByRole("table", { name: "Ticket list" })).toBeInTheDocument();
    expect(screen.getByLabelText("Search tickets")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });
});
