import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCommand, type ProvisionInput } from "./nemoclaw.js";

const providerName = process.env.OPENSHELL_DEEPSEEK_PROVIDER ?? "tasklattice-deepseek";
const nemoClawSandboxImage =
  process.env.OPENSHELL_SANDBOX_IMAGE ?? "tasklattice-nemoclaw-sandbox:0.3.0";
const nemoClawGatewayPort = process.env.NEMOCLAW_DASHBOARD_PORT ?? "18789";

export interface OpenShellSandbox {
  name: string;
  phase: string;
}

export function openShellBinary(): string {
  return process.env.OPENSHELL_BIN ?? "openshell";
}

export function openShellArguments(args: string[]): string[] {
  return [
    "--gateway-endpoint",
    process.env.OPENSHELL_GATEWAY_ENDPOINT ??
      "http://openshell.openshell.svc.cluster.local:8080",
    ...args,
  ];
}

export function deepSeekProviderCreateCommand(input: ProvisionInput): {
  args: string[];
  env: NodeJS.ProcessEnv;
} {
  const apiKey = input.apiKey ?? process.env.DEEPSEEK_API_KEY;
  return {
    args: openShellArguments([
      "provider",
      "create",
      "--name",
      providerName,
      "--type",
      "openai",
      "--credential",
      "OPENAI_API_KEY",
      "--config",
      `OPENAI_BASE_URL=${process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1"}`,
    ]),
    env: {
      ...process.env,
      ...(apiKey ? { OPENAI_API_KEY: apiKey } : {}),
    },
  };
}

export function openShellSandboxCreateArguments(
  input: ProvisionInput,
  instructionsFile: string,
): string[] {
  return openShellArguments([
    "sandbox",
    "create",
    "--name",
    input.name,
    "--from",
    nemoClawSandboxImage,
    "--cpu",
    process.env.OPENSHELL_SANDBOX_CPU ?? "1",
    "--memory",
    process.env.OPENSHELL_SANDBOX_MEMORY ?? "2Gi",
    "--provider",
    providerName,
    "--label",
    "tasklattice.ai/managed=true",
    "--upload",
    `${instructionsFile}:/sandbox/.openclaw/workspace/AGENTS.md`,
    "--no-tty",
    "--",
    "env",
    `NEMOCLAW_DASHBOARD_PORT=${nemoClawGatewayPort}`,
    "/usr/local/bin/nemoclaw-start",
  ]);
}

export function openShellNemoClawProbeArguments(name: string): string[] {
  return openShellArguments([
    "sandbox",
    "exec",
    "--name",
    name,
    "--",
    "/bin/sh",
    "-lc",
    `test -x /usr/local/bin/nemoclaw-start && test -f /sandbox/.openclaw/openclaw.json && curl -fsS --max-time 3 http://127.0.0.1:${nemoClawGatewayPort}/health >/dev/null`,
  ]);
}

export function openShellTerminalArguments(name: string): string[] {
  return openShellArguments([
    "sandbox",
    "exec",
    "--name",
    name,
    "--tty",
    "--timeout",
    "0",
    "--env",
    "TERM=xterm-256color",
    "--env",
    "COLORTERM=truecolor",
    "--",
    "/bin/bash",
    "-lc",
    "openclaw tui; " +
      "status=$?; " +
      "printf '\\r\\nOpenClaw TUI exited with status %s; continuing in the Sandbox shell.\\r\\n' \"$status\"; " +
      "exec /bin/bash -l",
  ]);
}

async function createOpenShellNemoClawSandbox(
  input: ProvisionInput,
  instructionsFile: string,
): Promise<string[]> {
  const timeoutMs = Number(process.env.NEMOCLAW_START_TIMEOUT_MS ?? "180000");
  return new Promise((resolve, reject) => {
    const child = spawn(
      openShellBinary(),
      openShellSandboxCreateArguments(input, instructionsFile),
      { env: process.env, stdio: ["ignore", "pipe", "pipe"] },
    );
    let output = "";
    let settled = false;
    let probing = false;
    const append = (data: Buffer) => {
      output = (output + data.toString()).slice(-64_000);
    };
    child.stdout.on("data", append);
    child.stderr.on("data", append);

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearInterval(probeTimer);
      clearTimeout(timeoutTimer);
      if (error) reject(error);
      else resolve(output.split("\n").filter(Boolean).slice(-100));
    };

    const probeTimer = setInterval(async () => {
      if (settled || probing) return;
      probing = true;
      try {
        const probe = await runCommand(
          openShellBinary(),
          openShellNemoClawProbeArguments(input.name),
        );
        if (probe.exitCode === 0) {
          // The startup command is intentionally long-lived. Match NemoClaw's
          // create-stream behavior: detach the local CLI once runtime health is
          // proven; OpenShell keeps nemoclaw-start as a child of its PID 1.
          settled = true;
          clearInterval(probeTimer);
          clearTimeout(timeoutTimer);
          child.kill("SIGTERM");
          resolve(output.split("\n").filter(Boolean).slice(-100));
        }
      } finally {
        probing = false;
      }
    }, 1_000);

    const timeoutTimer = setTimeout(() => {
      child.kill("SIGTERM");
      finish(
        new Error(
          `NemoClaw gateway startup timed out. ${output.trim().slice(-4_000)}`,
        ),
      );
    }, timeoutMs);

    child.on("error", (error) => finish(error));
    child.on("close", (code) => {
      if (settled) return;
      finish(
        new Error(
          output.trim() || `OpenShell sandbox creation exited ${code ?? 1}.`,
        ),
      );
    });
  });
}

async function ensureDeepSeekProvider(input: ProvisionInput): Promise<void> {
  const existing = await runCommand(
    openShellBinary(),
    openShellArguments(["provider", "get", providerName]),
  );
  if (existing.exitCode === 0) return;

  const apiKey = input.apiKey ?? process.env.DEEPSEEK_API_KEY;
  if (!apiKey)
    throw new Error(
      "A DeepSeek API key is required to create the OpenShell provider.",
    );

  const command = deepSeekProviderCreateCommand(input);
  const created = await runCommand(
    openShellBinary(),
    command.args,
    command.env,
  );
  if (created.exitCode !== 0) {
    // Another concurrent request may have created the shared provider.
    const retry = await runCommand(
      openShellBinary(),
      openShellArguments(["provider", "get", providerName]),
    );
    if (retry.exitCode !== 0)
      throw new Error(
        created.stderr.trim() || "Unable to configure the DeepSeek provider.",
      );
  }
}

export async function provisionOpenShellSandbox(
  input: ProvisionInput,
): Promise<string[]> {
  await ensureDeepSeekProvider(input);

  const inference = await runCommand(
    openShellBinary(),
    openShellArguments([
      "inference",
      "set",
      "--provider",
      providerName,
      "--model",
      input.model,
      "--timeout",
      process.env.OPENSHELL_INFERENCE_TIMEOUT ?? "120",
    ]),
  );
  if (inference.exitCode !== 0)
    throw new Error(
      inference.stderr.trim() || "OpenShell inference validation failed.",
    );

  const temporaryDirectory = await mkdtemp(join(tmpdir(), "tasklattice-openshell-"));
  const instructionsFile = join(temporaryDirectory, "AGENTS.md");
  try {
    await writeFile(
      instructionsFile,
      `## TaskLattice Agent Instructions\n\n${input.systemPrompt.trim()}\n`,
      { mode: 0o600 },
    );
    return await createOpenShellNemoClawSandbox(input, instructionsFile);
  } catch (error) {
    await deleteOpenShellSandbox(input.name).catch(() => undefined);
    throw error;
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

export async function observeOpenShellSandbox(
  name: string,
): Promise<OpenShellSandbox | undefined> {
  const result = await runCommand(
    openShellBinary(),
    openShellArguments(["sandbox", "list", "-o", "json"]),
  );
  if (result.exitCode !== 0)
    throw new Error(
      result.stderr.trim() || "Unable to list OpenShell sandboxes.",
    );
  const sandboxes = JSON.parse(result.stdout) as OpenShellSandbox[];
  return sandboxes.find((sandbox) => sandbox.name === name);
}

export async function deleteOpenShellSandbox(name: string): Promise<void> {
  const result = await runCommand(
    openShellBinary(),
    openShellArguments(["sandbox", "delete", name]),
  );
  if (
    result.exitCode !== 0 &&
    !`${result.stdout}\n${result.stderr}`.includes("sandbox not found")
  )
    throw new Error(
      result.stderr.trim() || "OpenShell sandbox deletion failed.",
    );
}
