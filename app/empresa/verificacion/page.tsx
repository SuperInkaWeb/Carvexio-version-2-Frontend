"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { kycService, BusinessDocument, DocumentStatus } from "../../../lib/kycService";

const DOCUMENT_TYPES = ["RUC", "Licencia Municipal", "DNI del representante", "Otro"];

const STATUS_LABEL: Record<DocumentStatus, string> = {
  PENDING: "En revisión",
  VERIFIED: "Verificado",
  REJECTED: "Rechazado",
};

const STATUS_STYLE: Record<DocumentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  VERIFIED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

export default function VerificacionEmpresaPage() {
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0]);
  const [documentNumber, setDocumentNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoadingDocs(true);
    const data = await kycService.getMyDocuments();
    setDocuments(data);
    setLoadingDocs(false);
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentNumber.trim() || !file || submitting) return;

    setSubmitting(true);
    setErr(null);
    setSuccess(false);

    try {
      await kycService.uploadDocument(file, documentType, documentNumber);
      setDocumentNumber("");
      setDocumentType(DOCUMENT_TYPES[0]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSuccess(true);
      loadDocuments();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "No se pudo subir el documento.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Verificación del negocio</h1>
        <p className="text-sm text-slate-500 mt-1">
          Sube tus documentos (RUC, licencia municipal) para que verifiquemos tu negocio antes de aprobarlo.
        </p>
      </header>

      {/* Formulario de subida */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">Subir documento</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="documentType" className="block text-sm font-medium text-slate-700 mb-1">Tipo de documento</label>
            <select
              id="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500 transition"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="documentNumber" className="block text-sm font-medium text-slate-700 mb-1">Número</label>
            <input
              id="documentNumber"
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              maxLength={100}
              placeholder="Ej: 20512345678"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500 transition"
            />
          </div>
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-medium text-slate-700 mb-1">Archivo (imagen o PDF)</label>
          <input
            id="file"
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100"
          />
        </div>

        {success && (
          <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            Documento subido. Lo revisaremos pronto.
          </p>
        )}
        {err && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{err}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !documentNumber.trim() || !file}
          className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Subiendo..." : "Subir documento"}
        </button>
      </form>

      {/* Lista de documentos */}
      <section className="space-y-3">
        <h2 className="font-semibold text-slate-800">Mis documentos</h2>

        {loadingDocs ? (
          <p className="text-sm text-slate-400 py-6 text-center">Cargando...</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center bg-white rounded-2xl border border-slate-200">
            Aún no has subido ningún documento.
          </p>
        ) : (
          <div className="space-y-3">
            {documents.map((d) => (
              <article key={d.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-800">{d.documentType}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">N.° {d.documentNumber}</p>
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-orange-600 hover:underline mt-1 inline-block"
                  >
                    Ver archivo
                  </a>
                </div>
                <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[d.status]}`}>
                  {STATUS_LABEL[d.status]}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
