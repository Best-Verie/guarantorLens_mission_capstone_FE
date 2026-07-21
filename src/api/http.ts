/** Thin fetch wrapper that surfaces the backend's error message. */

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "https://guarantorlens-mission-capstone-be.onrender.com";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

/** Turn a FastAPI error body into a readable message. */
function readError(status: number, data: unknown): string {
  if (data && typeof data === "object" && "detail" in data) {
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    // 422 validation errors come back as a list of {loc, msg}.
    if (Array.isArray(detail)) {
      const msgs = detail
        .map((d) => (d && typeof d === "object" && "msg" in d ? String((d as { msg: unknown }).msg) : null))
        .filter(Boolean);
      if (msgs.length) return msgs.join("; ");
    }
  }
  return `Request failed (${status}).`;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  // One fetch attempt with a timeout (free hosting can be slow to wake).
  const attempt = async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 40000);
    try {
      return await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  };

  const netError = (e: unknown) =>
    new ApiError(0,
      e instanceof DOMException && e.name === "AbortError"
        ? "The server took too long to respond. It may be waking up; try again."
        : "Could not reach the server. It may be waking up (free hosting sleeps when idle); try again in a moment.");

  let res: Response;
  try {
    res = await attempt();
  } catch (e) {
    // Render free tier sleeps; the first request after idle often fails. Retry GETs once.
    if (method === "GET") {
      await new Promise((r) => setTimeout(r, 2500));
      try { res = await attempt(); } catch (e2) { throw netError(e2); }
    } else {
      throw netError(e);
    }
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(res.status, readError(res.status, data));
  }
  return data as T;
}

/** Multipart POST (file uploads). Does not set Content-Type so the browser adds
 *  the multipart boundary. Longer timeout because model bundles are large. */
export async function requestForm<T>(path: string, form: FormData, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 120000);
  try {
    res = await fetch(`${API_URL}${path}`, { method: "POST", headers, body: form, signal: ctrl.signal });
  } catch (e) {
    const msg =
      e instanceof DOMException && e.name === "AbortError"
        ? "The upload took too long. The server may be starting up; try again."
        : "Could not reach the server.";
    throw new ApiError(0, msg);
  } finally {
    clearTimeout(timer);
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) throw new ApiError(res.status, readError(res.status, data));
  return data as T;
}
