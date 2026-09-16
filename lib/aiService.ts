import { apiFetch } from "./api";

export interface ChatResponse {
  sessionPublicId: string;
  responseMessage: string;
}

export interface SessionSummary {
  sessionPublicId: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionMessage {
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

/**
 * Cliente del asistente de repuestos con IA.
 * Las llamadas pasan por el proxy /api/backend, que adjunta el token de Auth0
 * en el servidor y las reenvía al backend (/api/ai/...).
 */
export const aiService = {
  chat: (message: string, sessionPublicId?: string): Promise<ChatResponse> =>
    apiFetch<ChatResponse>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, sessionPublicId }),
    }),

  getSessions: async (): Promise<SessionSummary[]> => {
    try {
      return await apiFetch<SessionSummary[]>("/ai/sessions");
    } catch {
      return [];
    }
  },

  getSessionMessages: async (sessionPublicId: string): Promise<SessionMessage[]> => {
    try {
      return await apiFetch<SessionMessage[]>(`/ai/sessions/${sessionPublicId}/messages`);
    } catch {
      return [];
    }
  },

  deleteSession: async (sessionPublicId: string): Promise<boolean> => {
    try {
      await apiFetch(`/ai/sessions/${sessionPublicId}`, { method: "DELETE" });
      return true;
    } catch {
      return false;
    }
  },
};
