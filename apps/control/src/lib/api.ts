import type {
  Agent,
  CreateAgentInput,
  TerminalSessionResponse,
} from "@tasklattice/contracts";
import { clearAuthToken, getAuthToken } from "./auth-token";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const payload = (await response.json()) as T | { error: string };
  if (response.status === 401 && typeof window !== "undefined") {
    clearAuthToken();
    window.location.assign("/login");
  }
  if (!response.ok)
    throw new Error(
      "error" in (payload as object)
        ? (payload as { error: string }).error
        : `Request failed (${response.status})`,
    );
  return payload as T;
}

export const api = {
  listAgents: async () =>
    (await request<{ data: Agent[] }>("/api/v1/agents")).data,
  getAgent: (id: string) => request<Agent>(`/api/v1/agents/${id}`),
  createAgent: (input: CreateAgentInput) =>
    request<Agent>("/api/v1/agents", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  deleteAgent: (id: string) =>
    request<void>(`/api/v1/agents/${id}`, { method: "DELETE" }),
  createTerminalSession: (id: string) =>
    request<TerminalSessionResponse>(
      `/api/v1/agents/${id}/terminal-sessions`,
      { method: "POST", body: "{}" },
    ),
};
