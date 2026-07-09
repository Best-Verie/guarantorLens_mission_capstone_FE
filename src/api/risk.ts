/** Risk assessment API: maps the assess form to POST /assess-risk. */
import { request } from "./http";

export interface Reason {
  label: string;
  direction: "up" | "down";
  detail: string;
  kind: "individual" | "network";
}

export interface NetworkInfo {
  n_guarantors: number;
  guarantors_with_prior_default: number;
  guarantor_ids: string[];
}

export interface ShapContribution {
  feature: string;
  label: string;
  value: number;
  direction: "up" | "down";
  kind?: "individual" | "network";
}

export interface AssessResult {
  risk_score: number;
  band: "Low" | "Medium" | "High";
  probability: number;
  source: "model" | "heuristic";
  brief?: string;                 // officer-style plain-English summary
  reasons: Reason[];
  recommendations: string[];      // plain, actionable suggestions
  shap: ShapContribution[];
  flags: string[];
  network: NetworkInfo;
  uids: Record<string, string>;   // account number -> opaque url id (borrower + guarantors)
}

export interface GuarantorOverride {
  savings?: number;
  salary?: number;
  loans_backed?: number;
  ever_defaulted?: number;
}

export interface AssessInput {
  borrower_id?: string;
  amount: number;
  savings: number;
  salary?: number | null;
  interest_rate?: number | null;
  disbursement_date?: string;
  guarantor_ids: string[];
  guarantor_overrides?: Record<string, GuarantorOverride>;
}

export function assessRisk(input: AssessInput, token: string): Promise<AssessResult> {
  return request<AssessResult>("/assess-risk", { method: "POST", body: input, token });
}

export interface GuarantorSuggestion {
  action: "swap" | "add";
  remove?: string | null;
  add: string;
  new_score: number;
  new_band: "Low" | "Medium" | "High";
  delta: number;
  add_savings?: number | null;
  add_loans_backed: number;
  why: string;
}

export interface SuggestResult {
  current: { score: number; band: string };
  suggestions: GuarantorSuggestion[];
  weakest_current?: string | null;
  message: string;
}

export function suggestGuarantors(input: AssessInput, token: string): Promise<SuggestResult> {
  return request<SuggestResult>("/assess/suggest-guarantors", { method: "POST", body: input, token });
}
