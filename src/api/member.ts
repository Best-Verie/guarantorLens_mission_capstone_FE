/** Member lookup API. */
import { request } from "./http";

export interface LoanRef {
  loan_key: string;
  amount: number;
  disb_date?: string | null;
  outcome: string;
  guarantors: string[];
}

export interface BackedLoan {
  loan_key: string;
  borrower: string;
  amount: number;
  outcome: string;
}

export interface NetNode {
  id: string;
  role: "self" | "backer" | "backed";
  ever_defaulted: boolean;
  loans_backed: number;
}

export interface NetEdge {
  source: string;
  target: string;
}

export interface MemberDetail {
  member_id: string;
  uid?: string | null;
  uids: Record<string, string>;   // account number -> opaque url id, for links on this page
  branch?: string | null;
  savings?: number | null;
  salary?: number | null;
  ever_defaulted: boolean;
  default_date?: string | null;
  loans_backed: number;
  total_connections: number;
  community_default_rate: number;
  loans: LoanRef[];
  backers: string[];
  guarantees_given: BackedLoan[];
  network: { nodes: NetNode[]; edges: NetEdge[] };
}

export interface MemberExamples {
  member_ids: string[];
  sample: {
    borrower_id: string; guarantor_ids: string[]; amount: number;
    savings?: number | null; salary?: number | null; interest_rate?: number | null;
  } | null;
}

export function getExamples(token: string): Promise<MemberExamples> {
  return request<MemberExamples>("/members/examples", { token });
}

export interface MemberRow {
  member_id: string;
  uid?: string | null;
  branch?: string | null;
  savings?: number | null;
  salary?: number | null;
  loans_backed: number;
  ever_defaulted: boolean;
}

export interface MemberList {
  items: MemberRow[];
  total: number;
  page: number;
  page_size: number;
  branches: string[];
}

export function listMembers(
  params: { q?: string; branch?: string; sort?: string; order?: string; page?: number; page_size?: number },
  token: string
): Promise<MemberList> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.branch) qs.set("branch", params.branch);
  if (params.sort) qs.set("sort", params.sort);
  if (params.order) qs.set("order", params.order);
  qs.set("page", String(params.page ?? 1));
  qs.set("page_size", String(params.page_size ?? 25));
  return request<MemberList>(`/members?${qs.toString()}`, { token });
}

export function getMember(id: string, token: string): Promise<MemberDetail> {
  return request<MemberDetail>(`/member/${encodeURIComponent(id)}`, { token });
}
