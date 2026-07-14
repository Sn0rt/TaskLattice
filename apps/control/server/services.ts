import { AgentService } from "./agents/agent-service";

const agentService = new AgentService();
let startup: Promise<void> | undefined;

export async function getAgentService(): Promise<AgentService> {
  startup ??= agentService.seedLocalDemo();
  await startup;
  return agentService;
}
