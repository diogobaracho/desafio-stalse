import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MetricsView } from "@/components/MetricsView";

import { metrics } from "./fixtures";
import { renderWithIntl } from "./render";

describe("MetricsView", () => {
  it("renders summary cards and breakdown tables", () => {
    renderWithIntl(<MetricsView metrics={metrics} />);

    expect(screen.getByText("Registros válidos").nextSibling).toHaveTextContent("147");
    expect(screen.getByText("Linhas lidas").nextSibling).toHaveTextContent("150");
    expect(screen.getByText("Datas inválidas descartadas").nextSibling).toHaveTextContent("3");

    const categories = screen.getByRole("region", { name: "Principais categorias" });
    expect(within(categories).getByRole("rowheader", { name: /Technical issue/ })).toBeInTheDocument();
    expect(within(categories).getByText("49")).toBeInTheDocument();

    expect(screen.getByRole("region", { name: "Por canal" })).toHaveTextContent("Email");
    expect(screen.getByRole("region", { name: "Por prioridade" })).toHaveTextContent("Medium");
    expect(screen.getByRole("region", { name: "Por status" })).toHaveTextContent("Closed");
    expect(screen.getByRole("region", { name: "Registros por dia" })).toHaveTextContent("1 de set. de 2026");
  });

  it("states that the data comes from the ETL pipeline", () => {
    renderWithIntl(<MetricsView metrics={metrics} />);

    expect(screen.getByTestId("metrics-provenance")).toHaveTextContent(
      "Gerado pelo pipeline de ETL a partir de customer_support_tickets.csv · dados até 30 de set. de 2026.",
    );
  });

  it("shows an empty state when the ETL produced no records", () => {
    renderWithIntl(
      <MetricsView metrics={{ ...metrics, total_records: 0, records_by_day: {}, top_categories: [] }} />,
    );

    expect(screen.getByText("Ainda não há dados de métricas")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("omits optional sections that the dataset does not provide", () => {
    const { by_status: _omit, ...withoutStatus } = metrics;
    renderWithIntl(<MetricsView metrics={withoutStatus} />, { locale: "en" });

    expect(screen.queryByRole("region", { name: "By status" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "By channel" })).toBeInTheDocument();
  });
});
