/** Auth API: maps the React forms to the FastAPI /auth endpoints. */
import { request } from "./http";

export type Role = "loan_officer" | "credit_manager" | "admin";

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: Role;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export function register(input: {
  fullName: string;
  email: string;
  role: Role;
  password: string;
}): Promise<TokenResponse> {
  // Backend expects snake_case full_name.
  return request<TokenResponse>("/auth/register", {
    method: "POST",
    body: {
      full_name: input.fullName,
      email: input.email,
      role: input.role,
      password: input.password,
    },
  });
}

export function login(input: { email: string; password: string }): Promise<TokenResponse> {
  return request<TokenResponse>("/auth/login", { method: "POST", body: input });
}

export function me(token: string): Promise<User> {
  return request<User>("/auth/me", { token });
}

export function forgotPassword(
  email: string
): Promise<{ message: string; reset_token?: string | null }> {
  return request("/auth/forgot-password", { method: "POST", body: { email } });
}

export function resetPassword(input: {
  token: string;
  newPassword: string;
}): Promise<{ message: string }> {
  return request("/auth/reset-password", {
    method: "POST",
    body: { token: input.token, new_password: input.newPassword },
  });
}
