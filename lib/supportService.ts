import { apiFetch } from "./api";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface TicketResponse {
  publicId: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string | null;
  createdAt: string;
}

export interface CreateTicketPayload {
  subject: string;
  description: string;
  category?: string;
}

/**
 * Canal de soporte del negocio (tickets a la plataforma).
 * Consume /api/support/tickets a través del proxy seguro /api/backend.
 */
export const supportService = {
  createTicket: (payload: CreateTicketPayload): Promise<TicketResponse> =>
    apiFetch<TicketResponse>("/support/tickets", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMyTickets: async (): Promise<TicketResponse[]> => {
    try {
      return await apiFetch<TicketResponse[]>("/support/tickets");
    } catch {
      return [];
    }
  },
};
