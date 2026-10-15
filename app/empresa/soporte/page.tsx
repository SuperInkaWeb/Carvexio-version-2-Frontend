"use client";

import { useEffect, useState, useCallback } from "react";
import { supportService, TicketResponse, TicketStatus } from "../../../lib/supportService";

const CATEGORIES = ["Facturación", "Técnico / Plataforma", "Cuenta", "Pagos", "Otro"];

const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En proceso",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

const STATUS_STYLE: Record<TicketStatus, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-200 text-slate-600",
};

export default function SoporteEmpresaPage() {
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    setLoadingTickets(true);
    const data = await supportService.getMyTickets();
    setTickets(data);
    setLoadingTickets(false);
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim() || submitting) return;

    setSubmitting(true);
    setErr(null);
    setSuccess(false);

    try {
      await supportService.createTicket({ subject, description, category });
      setSubject("");
      setDescription("");
      setCategory(CATEGORIES[0]);
      setSuccess(true);
      loadTickets();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "No se pudo enviar el ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Soporte del negocio</h1>
        <p className="text-sm text-slate-500 mt-1">
          ¿Tienes un problema con la plataforma? Escríbenos por aquí. Este canal es solo para el negocio,
          separado del chat con tus clientes.
        </p>
      </header>

      {/* Formulario para crear ticket */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">Nuevo ticket</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">Asunto</label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={255}
              placeholder="Ej: No puedo publicar un producto"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500 transition"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500 transition"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cuéntanos con detalle qué está ocurriendo..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500 transition min-h-[120px] resize-y"
          />
        </div>

        {success && (
          <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            Ticket enviado. Te responderemos pronto.
          </p>
        )}
        {err && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{err}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !subject.trim() || !description.trim()}
          className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Enviando..." : "Enviar ticket"}
        </button>
      </form>

      {/* Lista de tickets */}
      <section className="space-y-3">
        <h2 className="font-semibold text-slate-800">Mis tickets</h2>

        {loadingTickets ? (
          <p className="text-sm text-slate-400 py-6 text-center">Cargando...</p>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center bg-white rounded-2xl border border-slate-200">
            Aún no has abierto ningún ticket.
          </p>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <article key={t.publicId} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate">{t.subject}</h3>
                    {t.category && <p className="text-xs text-slate-400 mt-0.5">{t.category}</p>}
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[t.status]}`}>
                    {STATUS_LABEL[t.status]}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-2 line-clamp-3 whitespace-pre-wrap">{t.description}</p>
                <p className="text-xs text-slate-400 mt-3">
                  {new Date(t.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
