/** Member lookup API. */
import { request } from "./http";

export interface MemberProfile {
  member_id: string;
  branch?: string | null;
  savings?: number | null;
  salary?: number | null;
  ever_defaulted: boolean;
  default_date?: string | null;
  loans_backed: number;
  total_connections: number;
  community_default_rate: number;
}

export function getMember(id: string, token: string): Promise<MemberProfile> {
  return request<MemberProfile>(`/member/${encodeURIComponent(id)}`, { token });
}
