import { randomUUID } from "node:crypto";
import type { TerminalSessionResponse } from "@tasklattice/contracts";

export interface TerminalSessionRecord {
  agentId: string;
  sandboxName: string;
  expiresAt: number;
}

const sessions = new Map<string, TerminalSessionRecord>();

export function createTerminalSession(
  agentId: string,
  sandboxName: string,
): TerminalSessionResponse {
  const id = randomUUID();
  const token = randomUUID();
  const expiresAt = Date.now() + 5 * 60_000;
  sessions.set(`${id}:${token}`, { agentId, sandboxName, expiresAt });
  return {
    id,
    expiresAt: new Date(expiresAt).toISOString(),
    websocketUrl: `/api/v1/terminal-sessions/${id}/ws?token=${token}`,
  };
}

export function consumeTerminalSession(
  id: string,
  token: string,
): TerminalSessionRecord | undefined {
  const key = `${id}:${token}`;
  const session = sessions.get(key);
  sessions.delete(key);
  return session && session.expiresAt >= Date.now() ? session : undefined;
}
