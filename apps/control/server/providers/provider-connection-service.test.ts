import { describe, expect, it } from "vitest";
import { AgentStore } from "../data/agent-store";
import type { ProviderValidator } from "./pi-provider-validator";
import { ProviderConnectionService } from "./provider-connection-service";

const input = {
  name: "DeepSeek production",
  provider: "deepseek" as const,
  endpoint: "https://api.deepseek.com",
  model: "deepseek-chat" as const,
  apiKey: "test-api-key",
};

describe("ProviderConnectionService", () => {
  it("stores a validated provider connection without exposing its credential", async () => {
    const validator: ProviderValidator = {
      validate: async () => ({
        checks: [
          { id: "endpoint", label: "Endpoint reachability", status: "PASS" },
          { id: "model", label: "Pi model registration", status: "PASS" },
          { id: "credentials", label: "Credential scope", status: "PASS" },
          { id: "inference", label: "Minimal inference", status: "PASS" },
        ],
        latencyMs: 42,
        message: "Validated by Pi.",
      }),
    };
    const service = new ProviderConnectionService(
      new AgentStore(),
      validator,
    );
    const connection = await service.register(input);
    expect(connection.status).toBe("VALIDATED");
    expect(connection.credentialState).toBe("STORED");
    expect(connection.validationLatencyMs).toBe(42);
    expect(
      service.store.getProviderConnectionCredential(connection.id),
    ).toBe(input.apiKey);
    expect(JSON.stringify(service.list())).not.toContain(input.apiKey);
  });

  it("keeps a failed connection unavailable to Instance creation", async () => {
    const validator: ProviderValidator = {
      validate: async () => {
        throw new Error("Provider rejected the credential.");
      },
    };
    const service = new ProviderConnectionService(
      new AgentStore(),
      validator,
    );
    const connection = await service.register(input);
    expect(connection.status).toBe("FAILED");
    expect(connection.validationMessage).toContain("rejected");
  });
});
