import { z } from "zod";

export const agentStatuses = [
  "PROVISIONING",
  "READY",
  "FAILED",
  "DESTROYING",
] as const;

export const agentModels = ["deepseek-chat", "deepseek-reasoner"] as const;

export const createAgentSchema = z.object({
  name: z.string().trim().min(3).max(48),
  description: z.string().trim().max(240).default(""),
  runtime: z.literal("nemoclaw"),
  provider: z.literal("deepseek"),
  model: z.enum(agentModels),
  systemPrompt: z.string().trim().min(10).max(8000),
});

export type AgentStatus = (typeof agentStatuses)[number];
export type AgentModel = (typeof agentModels)[number];
export type CreateAgentInput = z.infer<typeof createAgentSchema>;

export interface Agent extends CreateAgentInput {
  id: string;
  sandboxName: string;
  status: AgentStatus;
  createdAt: string;
  updatedAt: string;
  operationId?: string;
  runtimePhase?: string;
  logs: string[];
  error?: string;
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
  error?: string;
}

export interface TerminalSessionResponse {
  id: string;
  expiresAt: string;
  websocketUrl: string;
}
