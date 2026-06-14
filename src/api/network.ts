/** Network explorer API. */
import { request } from "./http";
import type { NetEdge, NetNode } from "./member";

export interface NetworkView {
  center: string;
  nodes: NetNode[];
  edges: NetEdge[];
}

export function getNetwork(id: string, token: string): Promise<NetworkView> {
  return request<NetworkView>(`/network/${encodeURIComponent(id)}`, { token });
}
