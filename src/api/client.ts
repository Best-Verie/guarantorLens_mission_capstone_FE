const API_URL = import.meta.env.VITE_API_URL || '';

type RequestOptions = RequestInit & {
  body?: BodyInit | null;
};

export async function api<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const getHealth = () => api('/health');
export const assessRisk = (body: unknown) => api('/assess-risk', { method: 'POST', body: JSON.stringify(body) });
