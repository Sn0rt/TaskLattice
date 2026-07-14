import { describe, expect, it } from "vitest";
import { AgentStore } from "./agent-store";

describe("AgentStore", () => {
  it("persists the NemoClaw agent resource", () => {
    const store = new AgentStore();
    const now = new Date().toISOString();
    store.save({
      id: "a",
      name: "Research",
      description: "",
      runtime: "nemoclaw",
      sandboxName: "tasklattice-research-a",
      status: "PROVISIONING",
      provider: "deepseek",
      model: "deepseek-chat",
      systemPrompt: "You are a research agent.",
      createdAt: now,
      updatedAt: now,
      logs: [],
    });
    expect(store.get("a")?.runtime).toBe("nemoclaw");
    expect(store.list()).toHaveLength(1);
    store.saveProviderCredential("deepseek", "test-secret-value");
    expect(store.getProviderCredential("deepseek")).toBe("test-secret-value");
  });
});
