import { apiFetch } from "./api";

export type DocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface BusinessDocument {
  id: number;
  documentType: string;
  documentNumber: string;
  fileUrl: string;
  status: DocumentStatus;
  createdAt: string;
  reviewedAt: string | null;
}

/**
 * Verificación de identidad (KYC) del negocio.
 * Consume /api/business/documents a través del proxy seguro /api/backend.
 */
export const kycService = {
  uploadDocument: (file: File, documentType: string, documentNumber: string): Promise<BusinessDocument> => {
    const form = new FormData();
    form.append("file", file);
    form.append("documentType", documentType);
    form.append("documentNumber", documentNumber);
    // Sin Content-Type manual: el navegador pone el boundary de multipart automáticamente.
    return apiFetch<BusinessDocument>("/business/documents", { method: "POST", body: form });
  },

  getMyDocuments: async (): Promise<BusinessDocument[]> => {
    try {
      return await apiFetch<BusinessDocument[]>("/business/documents");
    } catch {
      return [];
    }
  },
};
