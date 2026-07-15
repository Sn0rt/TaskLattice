import { describe, expect, it, vi } from "vitest";
import {
  encodeTerminalResize,
  parseTerminalResize,
} from "@tasklattice/contracts";
import { nemoClawTerminalArguments, onboardCommand } from "./nemoclaw.js";
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

  it("opens only the Gateway-backed OpenClaw TUI", () => {
    const args = openShellTerminalArguments(input.name);
    expect(args).toContain(input.name);
    expect(args).toContain("--tty");
    expect(args).toContain("--timeout");
    expect(args).toContain("TERM=xterm-256color");
    expect(args.at(-1)).toBe("exec openclaw tui");
    expect(args.at(-1)).not.toContain("--local");
    expect(args.at(-1)).not.toContain("/bin/bash -l");
  });

  it("launches the OpenClaw TUI through a NemoClaw exec PTY", () => {
    const args = nemoClawTerminalArguments(input.name);
    expect(args.slice(0, 7)).toEqual([
      input.name,
      "exec",
      "--tty",
      "--stdin",
      "--timeout",
      "0",
      "--",
    ]);
    expect(args.at(-1)).toBe("exec openclaw tui");
  });

  it("round-trips bounded browser terminal resize messages", () => {
    expect(parseTerminalResize(encodeTerminalResize({ cols: 120, rows: 36 }))).toEqual({
      cols: 120,
      rows: 36,
    });
    expect(parseTerminalResize("plain terminal input")).toBeUndefined();
    expect(parseTerminalResize("\u0000TALI_RESIZE:120:36:1")).toBeUndefined();
    expect(parseTerminalResize(encodeTerminalResize({ cols: 2, rows: 1 }))).toBeUndefined();
  });
});
