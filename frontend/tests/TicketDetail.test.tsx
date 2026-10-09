import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { TicketDetail } from "@/components/TicketDetail";
import type { TicketUpdate } from "@/lib/api/types";

import { API, makeTicket } from "./fixtures";
import { errorResponse, server } from "./msw";
import { renderWithIntl } from "./render";

function renderDetail(readOnly = false) {
  const ticket = makeTicket();
  renderWithIntl(<TicketDetail initialTicket={ticket} readOnly={readOnly} />);
  return ticket;
}

describe("TicketDetail", () => {
  it("renders every ticket field", () => {
    renderDetail();

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("Mariana Souza")).toBeInTheDocument();
    expect(screen.getByText("E-mail")).toBeInTheDocument();
    expect(screen.getByText("Pagamento recusado no cartão de crédito")).toBeInTheDocument();
    expect(screen.getByText("Tentei finalizar a compra três vezes.")).toBeInTheDocument();
    expect(screen.getByTestId("current-status")).toHaveTextContent("Aberto");
    expect(screen.getByTestId("current-priority")).toHaveTextContent("Média");
    expect(screen.getAllByRole("time")).toHaveLength(2);
  });

  it("sends only the changed fields and shows the server-confirmed state", async () => {
    let body: TicketUpdate | undefined;
    server.use(
      http.patch(`${API}/tickets/1`, async ({ request }) => {
        body = (await request.json()) as TicketUpdate;
        // Server is the source of truth: it returns its own version of the ticket.
        return HttpResponse.json(
          makeTicket({ status: "closed", priority: "high", updated_at: "2026-10-08T12:00:00Z" }),
        );
      }),
    );
    const user = userEvent.setup();
    renderDetail();

    await user.selectOptions(screen.getByLabelText("Status"), "closed");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(
      await screen.findByText("Alterações salvas. Status: Fechado; prioridade: Alta."),
    ).toBeInTheDocument();
    expect(body).toEqual({ status: "closed" });
    expect(screen.getByTestId("current-status")).toHaveTextContent("Fechado");
    expect(screen.getByTestId("current-priority")).toHaveTextContent("Alta");
    expect(screen.getByLabelText("Prioridade")).toHaveValue("high");
  });

  it("disables the form while saving and ignores double submits", async () => {
    let calls = 0;
    server.use(
      http.patch(`${API}/tickets/1`, async () => {
        calls += 1;
        await delay(50);
        return HttpResponse.json(makeTicket({ priority: "high" }));
      }),
    );
    const user = userEvent.setup();
    renderDetail();

    await user.selectOptions(screen.getByLabelText("Prioridade"), "high");
    const button = screen.getByRole("button", { name: "Salvar alterações" });
    await user.dblClick(button);

    expect(screen.getByRole("button", { name: "Salvando…" })).toBeDisabled();
    expect(screen.getByLabelText("Status")).toBeDisabled();
    await screen.findByText(/Alterações salvas/);
    expect(calls).toBe(1);
  });

  it("shows a translated failure message and keeps the previous state", async () => {
    server.use(http.patch(`${API}/tickets/1`, () => errorResponse(422, "validation_error")));
    const user = userEvent.setup();
    renderDetail();

    await user.selectOptions(screen.getByLabelText("Status"), "closed");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(
      await screen.findByText("Não foi possível salvar: Os dados enviados são inválidos."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("current-status")).toHaveTextContent("Aberto");
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeEnabled();
  });

  it("explains a read-only rejection from the API", async () => {
    server.use(http.patch(`${API}/tickets/1`, () => errorResponse(403, "read_only_mode")));
    const user = userEvent.setup();
    renderDetail();

    await user.selectOptions(screen.getByLabelText("Status"), "closed");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByText(/somente leitura/)).toBeInTheDocument();
  });

  it("does not call the API when nothing changed", async () => {
    let calls = 0;
    server.use(
      http.patch(`${API}/tickets/1`, () => {
        calls += 1;
        return HttpResponse.json(makeTicket());
      }),
    );
    const user = userEvent.setup();
    renderDetail();

    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(screen.getByText("Nenhuma alteração para salvar.")).toBeInTheDocument();
    await waitFor(() => expect(calls).toBe(0));
  });

  it("disables triage controls in read-only mode", () => {
    renderDetail(true);

    expect(screen.getByLabelText("Status")).toBeDisabled();
    expect(screen.getByLabelText("Prioridade")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeDisabled();
  });
});
