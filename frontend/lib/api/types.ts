/** Mirrors backend schemas (specs/001-ticket-inbox-api/contracts/openapi.json). */

export const TICKET_STATUSES = ["open", "in_progress", "closed"] as const;
export const TICKET_PRIORITIES = ["low", "medium", "high"] as const;
export const CHANNELS = ["email", "chat", "phone", "whatsapp", "web"] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
export type Channel = (typeof CHANNELS)[number];

export interface Ticket {
  id: number;
  created_at: string;
  updated_at: string;
  customer_name: string;
  channel: Channel;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
}

export type TicketUpdate = Partial<Pick<Ticket, "status" | "priority">>;

export interface Health {
  status: "ok";
  service: string;
  version: string;
  environment: string;
  read_only: boolean;
}

export interface Metrics {
  generated_at: string | null;
  source: { file: string; rows_read: number };
  total_records: number;
  invalid_dates_dropped: number;
  date_range: { start: string | null; end: string | null };
  records_by_day: Record<string, number>;
  top_categories: { category: string; count: number }[];
  by_channel: Record<string, number>;
  by_priority: Record<string, number>;
  by_status?: Record<string, number>;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}
