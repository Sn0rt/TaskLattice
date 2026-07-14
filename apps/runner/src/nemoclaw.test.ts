import { describe, expect, it, vi } from "vitest";
import { onboardCommand } from "./nemoclaw.js";
import {
  deepSeekProviderCreateCommand,
  openShellNemoClawProbeArguments,
  openShellSandboxCreateArguments,
  openShellTerminalArguments,
} from "./openshell.js";

describe("NemoClaw command contract", () => {
  it("maps DeepSeek to the compatible endpoint without putting the key in argv", () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "host-secret-value");
    const command = onboardCommand({
      name: "tasklattice-research-a1b2c3d4",
      provider: "deepseek",
      model: "deepseek-chat",
      systemPrompt: "You are a research agent.",
      apiKey: "database-secret-value",
    });
    expect(command.args).toContain("openclaw");
    expect(command.args.join(" ")).not.toContain("database-secret-value");
    expect(command.env.NEMOCLAW_PROVIDER).toBe("custom");
    expect(command.env.NEMOCLAW_ENDPOINT_URL).toBe("https://api.deepseek.com");
    expect(command.env.COMPATIBLE_API_KEY).toBe("database-secret-value");
  });
});

describe("OpenShell Kubernetes command contract", () => {
  const input = {
    name: "tasklattice-research-a1b2c3d4",
    provider: "deepseek" as const,
    model: "deepseek-chat" as const,
    systemPrompt: "You are a research agent.",
    apiKey: "database-secret-value",
  };

  it("passes the DeepSeek key through the provider environment only", () => {
    const command = deepSeekProviderCreateCommand(input);
    expect(command.args.join(" ")).not.toContain("database-secret-value");
    expect(command.args).toContain("OPENAI_API_KEY");
    expect(command.env.OPENAI_API_KEY).toBe("database-secret-value");
  });

  it("creates a managed Pod-backed sandbox with uploaded instructions", () => {
    const args = openShellSandboxCreateArguments(input, "/tmp/AGENTS.md");
    expect(args).toContain("tasklattice-nemoclaw-sandbox:0.3.0");
    expect(args).toContain("tasklattice.ai/managed=true");
    expect(args).toContain(
      "/tmp/AGENTS.md:/sandbox/.openclaw/workspace/AGENTS.md",
    );
    expect(args).toContain("tasklattice-deepseek");
    expect(args).toContain("1");
    expect(args).toContain("2Gi");
    expect(args.slice(-3)).toEqual([
      "env",
      "NEMOCLAW_DASHBOARD_PORT=18789",
      "/usr/local/bin/nemoclaw-start",
    ]);
  });

  it("only marks the runtime healthy after the NemoClaw gateway responds", () => {
    const args = openShellNemoClawProbeArguments(input.name);
    expect(args).toContain(input.name);
    expect(args.at(-1)).toContain("/usr/local/bin/nemoclaw-start");
    expect(args.at(-1)).toContain("/sandbox/.openclaw/openclaw.json");
    expect(args.at(-1)).toContain("127.0.0.1:18789/health");
  });

  it("opens the DeepSeek-backed OpenClaw TUI before falling back to a shell", () => {
    const args = openShellTerminalArguments(input.name);
    expect(args).toContain(input.name);
    expect(args).toContain("--tty");
    expect(args.at(-1)).toContain("openclaw tui --local");
    expect(args.at(-1)).toContain("exec /bin/bash -l");
  });
});
