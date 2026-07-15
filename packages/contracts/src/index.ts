import { z } from "zod";

export const agentStatuses = [
  "PROVISIONING",
  "READY",
  "FAILED",
  "DESTROYING",
] as const;

export const agentModels = ["deepseek-chat", "deepseek-reasoner"] as const;

export const providerConnectionStatuses = ["VALIDATED", "FAILED"] as const;

export const createProviderConnectionSchema = z.object({
  name: z.string().trim().min(3).max(48),
  provider: z.literal("deepseek"),
  endpoint: z.string().trim().url(),
  model: z.enum(agentModels),
  apiKey: z.string().trim().min(8).max(512),
});

export const createAgentSchema = z.object({
  name: z.string().trim().min(3).max(48),
  description: z.string().trim().max(240).default(""),
  runtime: z.literal("nemoclaw"),
  providerConnectionId: z.string().trim().min(1),
  provider: z.literal("deepseek"),
  model: z.enum(agentModels),
  systemPrompt: z.string().trim().min(10).max(8000),
});

export type AgentStatus = (typeof agentStatuses)[number];
export type AgentModel = (typeof agentModels)[number];
export type ProviderConnectionStatus =
  (typeof providerConnectionStatuses)[number];
export type CreateProviderConnectionInput = z.infer<
  typeof createProviderConnectionSchema
>;
export type CreateAgentInput = z.infer<typeof createAgentSchema>;

export interface ProviderConnectionValidationCheck {
  id: "endpoint" | "model" | "credentials" | "inference";
  label: string;
  status: "PASS" | "FAIL";
}

export interface ProviderConnection
  extends Omit<CreateProviderConnectionInput, "apiKey"> {
  id: string;
  status: ProviderConnectionStatus;
  checks: ProviderConnectionValidationCheck[];
  credentialState: "STORED";
  validationMessage: string;
  validationLatencyMs?: number;
  validatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent extends CreateAgentInput {
  id: string;
  sandboxName: string;
  status: AgentStatus;
  createdAt: string;
  updatedAt: string;
  operationId?: string;
  runtimePhase?: string;
  logs: string[];
  httpEndpoint?: HttpEndpoint;
  error?: string;
}

export interface HttpEndpoint {
  kind: "openclaw-webui";
  status: "READY" | "UNAVAILABLE";
  url?: string;
  reason?: string;
}

export interface RunnerSandbox {
  name: string;
  phase:
    | "PROVISIONING"
    | "READY"
    | "FAILED"
    | "NOT_FOUND"
    | "DESTROYING";
  operationId?: string;
  logs: string[];
  httpEndpoint?: HttpEndpoint;
  error?: string;
}

export interface RunnerHealth {
  ok: boolean;
  mode: string;
}

export interface RuntimeStatus {
  mode: string;
  terminal: {
    available: boolean;
    kind: "nemoclaw-tui";
    transport: "nemoclaw" | "openshell" | "none";
    reason?: string;
  };
}

export function supportsNemoClawTui(mode: string): boolean {
  return mode === "nemoclaw" || mode === "openshell-kubernetes";
}

export interface TerminalSessionResponse {
  id: string;
  expiresAt: string;
  websocketUrl: string;
}

const terminalResizePrefix = "\u0000TALI_RESIZE:";

export interface TerminalResize {
  cols: number;
  rows: number;
}

export function encodeTerminalResize({ cols, rows }: TerminalResize): string {
  return `${terminalResizePrefix}${cols}:${rows}`;
}

export function parseTerminalResize(input: string): TerminalResize | undefined {
  if (!input.startsWith(terminalResizePrefix)) return undefined;
  const parts = input.slice(terminalResizePrefix.length).split(":");
  if (parts.length !== 2) return undefined;
  const [colsText, rowsText] = parts;
  if (colsText === undefined || rowsText === undefined) return undefined;
  const cols = Number(colsText);
  const rows = Number(rowsText);
  if (
    !Number.isInteger(cols) ||
    !Number.isInteger(rows) ||
    cols < 20 ||
    cols > 500 ||
    rows < 5 ||
    rows > 300
  )
    return undefined;
  return { cols, rows };
}
