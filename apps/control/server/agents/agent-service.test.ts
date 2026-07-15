import { describe, expect, it } from "vitest";
import { agentSandboxName } from "./agent-service";

describe("Agent sandbox naming", () => {
  it("stays within the OpenShell service-routing limit", () => {
    const name = agentSandboxName(
      "A Very Long Research Assistant Name",
      "12345678-1234-4000-8000-123456789abc",
    );

    expect(name).toBe("tali-a-very-long-re-12345678");
    expect(name.length).toBeLessThanOrEqual(28);
    expect(name).toMatch(/^[a-z][a-z0-9-]+[a-z0-9]$/);
  });

  it("keeps the id suffix when the display name has no slug characters", () => {
    expect(
      agentSandboxName("研究助手", "abcdef01-1234-4000-8000-123456789abc"),
    ).toBe("tali-agent-abcdef01");
  });
});
