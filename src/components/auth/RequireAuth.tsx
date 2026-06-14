import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getToken } from "../../lib/session";

/** Gate for signed-in pages. Redirects to /login when there is no token. */
export function RequireAuth({ children }: { children: ReactNode }) {
  return getToken() ? <>{children}</> : <Navigate to="/login" replace />;
}
