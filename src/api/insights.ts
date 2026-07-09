/** Portfolio insights API: watchlist, super-guarantors, communities. */
import { request } from "./http";

export interface WatchlistItem {
  loan_key: string;
  borrower: string;
  borrower_uid?: string | null;
  branch?: string | null;
  amount: number;
  days_in_arrears: number;
  backed_by_defaulter: boolean;
}

export interface SuperGuarantor {
  member_id: string;
  uid?: string | null;
  branch?: string | null;
  loans_backed: number;
  ever_defaulted: boolean;
  bad_loans_backed: number;
}

export interface CommunityStat {
  community_id: string;
  branch?: string | null;
  size: number;
  default_rate: number;
}

export function getWatchlist(token: string): Promise<WatchlistItem[]> {
  return request<WatchlistItem[]>("/watchlist", { token });
}

export function getSuperGuarantors(token: string): Promise<SuperGuarantor[]> {
  return request<SuperGuarantor[]>("/insights/super-guarantors", { token });
}

export function getCommunities(token: string): Promise<CommunityStat[]> {
  return request<CommunityStat[]>("/insights/communities", { token });
}

export interface WeakLink {
  member_id: string;
  uid?: string | null;
  branch?: string | null;
  ever_defaulted: boolean;
  loans_backed: number;
  high_risk: number;
  exposure: number;
}

export function getWeakLinks(token: string, limit = 12): Promise<WeakLink[]> {
  return request<WeakLink[]>(`/insights/weak-links?limit=${limit}`, { token });
}

export interface ContagionLoan {
  loan_key: string;
  borrower: string;
  borrower_uid?: string | null;
  amount: number;
  band: "Low" | "Medium" | "High";
  score: number;
}

export interface Contagion {
  member_id: string;
  uid?: string | null;
  loans_backed: number;
  high_risk: number;
  medium_risk: number;
  exposure: number;
  loans: ContagionLoan[];
}

export function getContagion(ref: string, token: string): Promise<Contagion> {
  return request<Contagion>(`/member/${encodeURIComponent(ref)}/contagion`, { token });
}

export interface EarlyWarningItem {
  loan_key: string;
  borrower: string;
  borrower_uid?: string | null;
  branch?: string | null;
  amount: number;
  days_in_arrears: number;
  risk_score: number;
  band: "Low" | "Medium" | "High";
}

export function getEarlyWarning(token: string): Promise<EarlyWarningItem[]> {
  return request<EarlyWarningItem[]>("/insights/early-warning", { token });
}

export interface InsightsOverview {
  n_loans: number;
  n_members: number;
  total_disbursed: number;
  outcomes: Record<string, number>;
  branches: Record<string, number>;
  bad_rate: number;
  written_off_value: number;
  n_arrears: number;
  arrears_value: number;
  unique_guarantors: number;
  avg_guarantors: number;
  over_committed: number;
  ever_defaulted: number;
  loans_backed_by_defaulter: number;
  pct_backed_by_defaulter: number;
  n_communities: number;
  worst_community_rate: number;
}

export function getOverview(token: string): Promise<InsightsOverview> {
  return request<InsightsOverview>("/insights/overview", { token });
}
