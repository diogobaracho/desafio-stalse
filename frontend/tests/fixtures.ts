import type { Metrics, Ticket } from "@/lib/api/types";

export const API = "http://api.test";

export function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 1,
    created_at: "2026-09-21T09:12:00Z",
    updated_at: "2026-09-21T09:12:00Z",
    customer_name: "Mariana Souza",
    channel: "email",
    subject: "Pagamento recusado no cartão de crédito",
    description: "Tentei finalizar a compra três vezes.",
    status: "open",
    priority: "medium",
    ...overrides,
  };
}

export const tickets: Ticket[] = [
  makeTicket(),
  makeTicket({
    id: 2,
    customer_name: "Carlos Henrique Lima",
    channel: "chat",
    subject: "Pedido não entregue após 10 dias",
    status: "in_progress",
    priority: "high",
    created_at: "2026-09-21T10:40:00Z",
  }),
];

export const metrics: Metrics = {
  generated_at: "2026-09-30T00:00:00Z",
  source: { file: "customer_support_tickets.csv", rows_read: 150 },
  total_records: 147,
  invalid_dates_dropped: 3,
  date_range: { start: "2026-09-01", end: "2026-09-30" },
  records_by_day: { "2026-09-01": 6, "2026-09-02": 3 },
  top_categories: [
    { category: "Technical issue", count: 49 },
    { category: "Refund request", count: 34 },
  ],
  by_channel: { Email: 48, Chat: 47 },
  by_priority: { Medium: 58, Low: 44 },
  by_status: { Closed: 57, Open: 49 },
};
