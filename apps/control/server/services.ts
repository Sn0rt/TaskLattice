import { AgentService } from "./agents/agent-service";
import { AgentStore } from "./data/agent-store";
import { ProviderConnectionService } from "./providers/provider-connection-service";

const store = new AgentStore();
const agentService = new AgentService(store);
const providerConnectionService = new ProviderConnectionService(store);
let startup: Promise<void> | undefined;

export async function getAgentService(): Promise<AgentService> {
  startup ??= (async () => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (process.env.TALI_ENABLE_TEST_SEED === "1" && apiKey)
      providerConnectionService.seedLocalValidated(apiKey);
    await agentService.seedLocalDemo();
  })();
  await startup;
  return agentService;
}

export async function getProviderConnectionService(): Promise<ProviderConnectionService> {
  await getAgentService();
  return providerConnectionService;
}
