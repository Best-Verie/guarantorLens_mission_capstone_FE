/** Portfolio insights API: watchlist, super-guarantors, communities. */
import { request } from "./http";

export interface WatchlistItem {
  loan_key: string;
  borrower: string;
  branch?: string | null;
  amount: number;
  days_in_arrears: number;
  backed_by_defaulter: boolean;
}

export interface SuperGuarantor {
  member_id: string;
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

export interface EarlyWarningItem {
  loan_key: string;
  borrower: string;
  branch?: string | null;
  amount: number;
  days_in_arrears: number;
  risk_score: number;
  band: "Low" | "Medium" | "High";
}

export function getEarlyWarning(token: string): Promise<EarlyWarningItem[]> {
  return request<EarlyWarningItem[]>("/insights/early-warning", { token });
}
