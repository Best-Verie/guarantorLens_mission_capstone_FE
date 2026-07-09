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
  reasons: Reason[];
  recommendations: string[];      // plain, actionable suggestions
  shap: ShapContribution[];
  flags: string[];
  network: NetworkInfo;
  uids: Record<string, string>;   // account number -> opaque url id (borrower + guarantors)
}

export interface AssessInput {
  borrower_id?: string;
  amount: number;
  savings: number;
  salary?: number | null;
  disbursement_date?: string;
  guarantor_ids: string[];
}

export function assessRisk(input: AssessInput, token: string): Promise<AssessResult> {
  return request<AssessResult>("/assess-risk", { method: "POST", body: input, token });
}
