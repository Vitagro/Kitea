const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function buildQueryString(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    const body = isJson ? await response.json().catch(() => null) : null;
    throw new ApiError(response.status, body?.message ?? `Erreur HTTP ${response.status}`, body?.details);
  }

  return isJson ? ((await response.json()) as T) : ((await response.blob()) as unknown as T);
}

// Client HTTP minimal (fetch natif) vers l'API Express — utilisable aussi
// bien depuis des Server Components que des Client Components Next.js.
export const apiClient = {
  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}${buildQueryString(params)}`, { cache: "no-store" });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    return handleResponse<T>(response);
  },

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "PATCH",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    return handleResponse<T>(response);
  },

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, { method: "DELETE", cache: "no-store" });
    return handleResponse<T>(response);
  },

  async upload<T>(path: string, file: File, fieldName = "file"): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);
    const response = await fetch(`${API_BASE_URL}${path}`, { method: "POST", body: formData, cache: "no-store" });
    return handleResponse<T>(response);
  },

  async downloadBlob(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}${path}${buildQueryString(params)}`, { cache: "no-store" });
    if (!response.ok) throw new ApiError(response.status, `Erreur HTTP ${response.status}`);
    return response.blob();
  },
};

// Déclenche le téléchargement d'un Blob dans le navigateur (usage client uniquement).
export function saveBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
