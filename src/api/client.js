const API_URL = import.meta.env.API_URL || "https://guarantorlens-mission-capstone-be.onrender.com";

export async function api(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// endpoints to wire up later:
export const getHealth = () => api("/health");
export const assessRisk = (body) => api("/assess-risk", { method: "POST", body: JSON.stringify(body) });