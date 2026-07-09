/** Loan-application workflow API: create+assess, list, escalate, recommend. */
import { request } from "./http";
import type { Reason } from "./risk";

export interface RecommendationOut {
  id: number;
  author_name?: string | null;
  author_role?: string | null;
  decision: string;
  note?: string | null;
  created_at: string;
}

export interface ApplicationOut {
  id: number;
  created_by_name?: string | null;
  branch?: string | null;
  borrower_id?: string | null;
  borrower_name?: string | null;
  amount: number;
  savings?: number | null;
  salary?: number | null;
  interest_rate?: number | null;
  guarantor_ids: string[];
  risk_score?: number | null;
  band?: "Low" | "Medium" | "High" | null;
  probability?: number | null;
  reasons: Reason[];
  flags: string[];
  source?: string | null;
  status: string;
  escalation_note?: string | null;
  created_at: string;
  recommendations: RecommendationOut[];
}

export interface ApplicationListItem {
  id: number;
  borrower?: string | null;
  branch?: string | null;
  amount: number;
  risk_score?: number | null;
  band?: string | null;
  status: string;
  created_by_name?: string | null;
  created_at: string;
}

export interface ApplicationStats {
  my_open: number;
  escalated: number;
  total: number;
}

export interface ApplicationCreate {
  amount: number;
  savings: number;
  salary?: number | null;
  interest_rate?: number | null;
  guarantor_ids: string[];
  borrower_id?: string;
  borrower_name?: string;
  branch?: string;
}

export function createApplication(input: ApplicationCreate, token: string): Promise<ApplicationOut> {
  return request<ApplicationOut>("/applications", { method: "POST", body: input, token });
}

export function listApplications(token: string, opts: { escalated?: boolean; status?: string } = {}): Promise<ApplicationListItem[]> {
  const q = new URLSearchParams();
  if (opts.escalated) q.set("escalated", "true");
  if (opts.status) q.set("status", opts.status);
  const qs = q.toString();
  return request<ApplicationListItem[]>(`/applications${qs ? "?" + qs : ""}`, { token });
}

export function getApplication(id: number, token: string): Promise<ApplicationOut> {
  return request<ApplicationOut>(`/applications/${id}`, { token });
}

export function escalateApplication(id: number, note: string, token: string): Promise<ApplicationOut> {
  return request<ApplicationOut>(`/applications/${id}/escalate`, { method: "POST", body: { note }, token });
}

export function addRecommendation(id: number, decision: string, note: string, token: string): Promise<ApplicationOut> {
  return request<ApplicationOut>(`/applications/${id}/recommendations`, { method: "POST", body: { decision, note }, token });
}

export function getApplicationStats(token: string): Promise<ApplicationStats> {
  return request<ApplicationStats>("/applications/stats", { token });
}
