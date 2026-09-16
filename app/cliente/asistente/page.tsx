"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, Plus, MessageSquare, Trash2, Wrench } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast, Toaster } from "sonner";
import { aiService, SessionSummary } from "../../../lib/aiService";

const STORAGE_KEY = "ai-last-session-repuestos";

type ChatMessage = { role: "USER" | "AI"; content: string };

// Estilos para el Markdown que devuelve el asistente (tablas, listas, negritas).
// react-markdown NO usa dangerouslySetInnerHTML, por lo que es seguro frente a XSS.
const markdownComponents = {
  table: (props: React.ComponentPropsWithoutRef<"table">) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-sm border-collapse" {...props} />
    </div>
  ),
  thead: (props: React.ComponentPropsWithoutRef<"thead">) => (
    <thead className="bg-slate-100" {...props} />
  ),
  th: (props: React.ComponentPropsWithoutRef<"th">) => (
    <th className="border border-slate-200 px-3 py-2 text-left font-semibold" {...props} />
  ),
  td: (props: React.ComponentPropsWithoutRef<"td">) => (
    <td className="border border-slate-200 px-3 py-2 align-top" {...props} />
  ),
  ul: (props: React.ComponentPropsWithoutRef<"ul">) => (
    <ul className="list-disc pl-5 space-y-1 my-2" {...props} />
  ),
  ol: (props: React.ComponentPropsWithoutRef<"ol">) => (
    <ol className="list-decimal pl-5 space-y-1 my-2" {...props} />
  ),
  h1: (props: React.ComponentPropsWithoutRef<"h1">) => (
    <h1 className="text-lg font-bold mt-3 mb-1" {...props} />
  ),
  h2: (props: React.ComponentPropsWithoutRef<"h2">) => (
    <h2 className="text-base font-bold mt-3 mb-1" {...props} />
  ),
  h3: (props: React.ComponentPropsWithoutRef<"h3">) => (
    <h3 className="text-sm font-bold mt-2 mb-1" {...props} />
  ),
  p: (props: React.ComponentPropsWithoutRef<"p">) => (
    <p className="my-1.5 leading-relaxed" {...props} />
  ),
  strong: (props: React.ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold" {...props} />
  ),
  a: (props: React.ComponentPropsWithoutRef<"a">) => (
    <a className="text-blue-600 underline" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  blockquote: (props: React.ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote className="border-l-4 border-slate-200 pl-3 italic text-slate-500 my-2" {...props} />
  ),
  code: (props: React.ComponentPropsWithoutRef<"code">) => (
    <code className="bg-slate-100 rounded px-1 py-0.5 text-xs" {...props} />
  ),
};

export default function AsistenteRepuestosPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionPublicId, setSessionPublicId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    const data = await aiService.getSessions();
    setSessions(data);
    setLoadingSessions(false);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const loadSessionMessages = useCallback(async (publicId: string) => {
    const msgs = await aiService.getSessionMessages(publicId);
    setMessages(msgs.map((m) => ({ role: m.role === "ASSISTANT" ? "AI" : "USER", content: m.content })));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSessionPublicId(stored);
      loadSessionMessages(stored);
    }
  }, [loadSessionMessages]);

  const handleSelectSession = async (publicId: string) => {
    setSessionPublicId(publicId);
    localStorage.setItem(STORAGE_KEY, publicId);
    setIsLoading(true);
    await loadSessionMessages(publicId);
    setIsLoading(false);
  };

  const handleNewChat = () => {
    setSessionPublicId(undefined);
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleDeleteSession = async (publicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await aiService.deleteSession(publicId);
    if (success) {
      setSessions((prev) => prev.filter((s) => s.sessionPublicId !== publicId));
      if (sessionPublicId === publicId) {
        setSessionPublicId(undefined);
        setMessages([]);
        localStorage.removeItem(STORAGE_KEY);
      }
      toast.success("Conversación eliminada.");
    } else {
      toast.error("Error al eliminar la conversación.");
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setMessages((prev) => [...prev, { role: "USER", content: userText }]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await aiService.chat(userText, sessionPublicId);
      if (!sessionPublicId) {
        setSessionPublicId(response.sessionPublicId);
        localStorage.setItem(STORAGE_KEY, response.sessionPublicId);
        loadSessions();
      }
      setMessages((prev) => [...prev, { role: "AI", content: response.responseMessage }]);
    } catch {
      toast.error("Error al comunicarse con el asistente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <Toaster richColors position="top-right" />

      {/* Historial de conversaciones */}
      <div
        className={`${sidebarOpen ? "w-72" : "w-0"} transition-all duration-300 border-r border-slate-200 bg-slate-50 flex flex-col overflow-hidden`}
      >
        <div className="p-3 border-b border-slate-200">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva consulta
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingSessions ? (
            <div className="text-center text-slate-400 text-sm py-8">Cargando...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-8 px-4">Sin consultas anteriores</div>
          ) : (
            sessions.map((s) => (
              <button
                key={s.sessionPublicId}
                onClick={() => handleSelectSession(s.sessionPublicId)}
                className={`w-full text-left p-3 rounded-xl text-sm transition group ${
                  sessionPublicId === s.sessionPublicId
                    ? "bg-white border border-slate-200 shadow-sm"
                    : "hover:bg-white/60"
                }`}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-700 truncate">{s.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {s.messageCount} msgs ·{" "}
                      {new Date(s.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                  <span
                    onClick={(e) => handleDeleteSession(s.sessionPublicId, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 transition shrink-0"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 p-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-200 transition"
            title={sidebarOpen ? "Ocultar historial" : "Mostrar historial"}
          >
            <MessageSquare className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Wrench className="w-5 h-5 text-blue-600" />
            Asistente de repuestos
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <Bot className="w-16 h-16 text-slate-300" />
              <p className="text-lg font-medium text-slate-500">¿En qué puedo ayudarte con tu vehículo?</p>
              <div className="flex gap-2 mt-4 text-sm">
                <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 border border-slate-200">Repuestos</span>
                <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 border border-slate-200">Diagnóstico</span>
                <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 border border-slate-200">Mantenimiento</span>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === "USER" ? "justify-end" : "justify-start"}`}>
                {msg.role === "AI" && (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                    <Bot className="w-6 h-6 text-blue-600" />
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl max-w-[80%] ${
                    msg.role === "USER"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm"
                  }`}
                >
                  {msg.role === "USER" ? (
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  ) : (
                    <div className="text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-4 justify-start animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
              <div className="bg-slate-100 p-4 rounded-2xl w-48 h-12 rounded-bl-none"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-200">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Escribe tu consulta sobre tu vehículo (marca, modelo y año)..."
              className="w-full bg-slate-100 border-none rounded-full py-4 pl-6 pr-14 outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="absolute right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-3">
            El asistente es una ayuda orientativa. Confirma siempre con un técnico antes de comprar o reparar.
          </p>
        </div>
      </div>
    </div>
  );
}
