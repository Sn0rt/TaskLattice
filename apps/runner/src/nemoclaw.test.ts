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
  openShellWebUiOrigin,
  openShellWebUiOriginProbeArguments,
  openShellWebUiServiceArguments,
  openShellWebUiTokenArguments,
  parseOpenShellServiceUrl,
  tokenizedOpenClawUrl,
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
    const args = openShellSandboxCreateArguments(
      input,
      "/tmp/AGENTS.md",
      "/tmp/tali-nemoclaw-start",
    );
    expect(args).toContain("tasklattice-nemoclaw-sandbox:0.3.0");
    expect(args).toContain("tasklattice.ai/managed=true");
    expect(args).toContain(
      "/tmp/AGENTS.md:/sandbox/.openclaw/workspace/AGENTS.md",
    );
    expect(args).toContain(
      "/tmp/tali-nemoclaw-start:/tmp/tali-nemoclaw-start",
    );
    expect(args).toContain("tasklattice-deepseek");
    expect(args).toContain("1");
    expect(args).toContain("2Gi");
    expect(args.slice(-4)).toEqual([
      "/bin/bash",
      "/tmp/tali-nemoclaw-start",
      "http://tasklattice-research-a1b2c3d4--webui.openshell.localhost:8080",
      "18789",
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

  it("exposes the NemoClaw Web UI as a named OpenShell service", () => {
    expect(openShellWebUiServiceArguments(input.name, "expose").slice(-5)).toEqual([
      "service",
      "expose",
      input.name,
      "18789",
      "webui",
    ]);
    expect(openShellWebUiServiceArguments(input.name, "get").slice(-4)).toEqual([
      "service",
      "get",
      input.name,
      "webui",
    ]);
    expect(openShellWebUiServiceArguments(input.name, "delete").slice(-4)).toEqual([
      "service",
      "delete",
      input.name,
      "webui",
    ]);
  });

  it("extracts the browser endpoint from colored OpenShell output", () => {
    expect(
      parseOpenShellServiceUrl(
        "URL: \u001b[36mhttp://sandbox--webui.openshell.localhost:8080/\u001b[39m\n",
      ),
    ).toBe("http://sandbox--webui.openshell.localhost:8080/");
    expect(parseOpenShellServiceUrl("service endpoint not found")).toBeUndefined();
  });

  it("authorizes the routed origin and bootstraps dashboard authentication", () => {
    const endpoint =
      "http://tali-research-a1b2c3d4--webui.openshell.localhost:8080/";
    expect(openShellWebUiOrigin("tali-research-a1b2c3d4")).toBe(
      "http://tali-research-a1b2c3d4--webui.openshell.localhost:8080",
    );
    expect(openShellWebUiOriginProbeArguments(input.name, endpoint)).toContain(
      "http://tali-research-a1b2c3d4--webui.openshell.localhost:8080",
    );
    expect(openShellWebUiTokenArguments(input.name).slice(-6)).toEqual([
      "--name",
      input.name,
      "--",
      "node",
      "-e",
      'const c=require("/sandbox/.openclaw/openclaw.json");process.stdout.write(c.gateway.auth.token)',
    ]);
    expect(tokenizedOpenClawUrl(endpoint, "secret value\n")).toBe(
      `${endpoint}#token=secret+value`,
    );
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
