import { request } from "./client";
import type { Ticket, TicketUpdate } from "./types";

export function listTickets(search?: string, signal?: AbortSignal): Promise<Ticket[]> {
  const query = search?.trim() ? `?${new URLSearchParams({ search: search.trim() })}` : "";
  return request<Ticket[]>(`/tickets${query}`, { signal });
}

export function getTicket(id: number): Promise<Ticket> {
  return request<Ticket>(`/tickets/${id}`);
}

export function updateTicket(id: number, update: TicketUpdate): Promise<Ticket> {
  return request<Ticket>(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify(update) });
}
