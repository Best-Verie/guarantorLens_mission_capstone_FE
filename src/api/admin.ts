/** Admin API: user governance, deployed-model card, activity, model upload. */
import { request, requestForm } from "./http";
import type { Role } from "./auth";

export interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  created_at?: string | null;
  applications: number;
}

export interface ModelCard {
  source: string;
  loaded: boolean;
  model_name?: string | null;
  trained_at?: string | null;
  n_features: number;
  features: string[];
  network_features: string[];
  bands: Record<string, number>;
  flag_thresholds: Record<string, number>;
  metrics: Record<string, number | string>;
  n_members: number;
  n_borrowers_with_loans: number;
}

export interface ActivityStats {
  users_total: number;
  users_by_role: Record<string, number>;
  applications_total: number;
  applications_by_status: Record<string, number>;
  applications_by_band: Record<string, number>;
}

export function listUsers(token: string): Promise<AdminUser[]> {
  return request<AdminUser[]>("/admin/users", { token });
}

export function setUserRole(id: number, role: Role, token: string): Promise<AdminUser> {
  return request<AdminUser>(`/admin/users/${id}/role`, { method: "PATCH", body: { role }, token });
}

export function deleteUser(id: number, token: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/admin/users/${id}`, { method: "DELETE", token });
}

export function getModelCard(token: string): Promise<ModelCard> {
  return request<ModelCard>("/admin/model", { token });
}

export function getActivity(token: string): Promise<ActivityStats> {
  return request<ActivityStats>("/admin/activity", { token });
}

export function clearApplications(token: string): Promise<{ message: string }> {
  return request<{ message: string }>("/admin/applications", { method: "DELETE", token });
}

export function uploadModel(
  files: { model: File; members?: File | null; loans?: File | null },
  token: string
): Promise<ModelCard> {
  const fd = new FormData();
  fd.append("model", files.model);
  if (files.members) fd.append("members", files.members);
  if (files.loans) fd.append("loans", files.loans);
  return requestForm<ModelCard>("/admin/model", fd, token);
}
