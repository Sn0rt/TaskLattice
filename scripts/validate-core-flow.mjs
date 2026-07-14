import WebSocket from "ws";

const baseUrl = process.env.TALI_BASE_URL ?? "http://127.0.0.1:18080";
const expectNemoClawRuntime = process.env.TALI_EXPECT_NEMOCLAW_RUNTIME === "1";
const validationUsername =
  process.env.TALI_VALIDATION_USERNAME ??
  process.env.TALI_AUTH_LOCAL_USERNAME ??
  "admin";
const validationPassword =
  process.env.TALI_VALIDATION_PASSWORD ??
  process.env.TALI_AUTH_LOCAL_PASSWORD ??
  "admin";
let authToken = "";

async function request(path, init) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
      ...init?.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
  return payload;
}

const login = await request("/api/v1/auth/local", {
  method: "POST",
  body: JSON.stringify({
    password: validationPassword,
    remember: false,
    username: validationUsername,
  }),
});
authToken = login.token;

const created = await request("/api/v1/agents", {
  method: "POST",
  body: JSON.stringify({
    name: `validation-${Date.now().toString().slice(-6)}`,
    description: "REST and terminal contract validation",
    runtime: "nemoclaw",
    provider: "deepseek",
    model: "deepseek-chat",
    systemPrompt: "You are a validation agent. Report runtime evidence clearly.",
  }),
});

let agent = created;
for (let attempt = 0; attempt < 120 && agent.status === "PROVISIONING"; attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  agent = await request(`/api/v1/agents/${created.id}`);
}
if (agent.status !== "READY") throw new Error(`Agent did not become READY: ${JSON.stringify(agent)}`);

const session = await request(`/api/v1/agents/${agent.id}/terminal-sessions`, { method: "POST", body: "{}" });
const wsBase = new URL(baseUrl);
wsBase.protocol = wsBase.protocol === "https:" ? "wss:" : "ws:";
const socket = new WebSocket(new URL(session.websocketUrl, wsBase));

const terminalEvidence = await new Promise((resolve, reject) => {
  let output = "";
  const timer = setTimeout(() => reject(new Error(`Terminal timeout: ${output}`)), 15_000);
  socket.on("open", () =>
    socket.send(
      expectNemoClawRuntime
        ? "printf 'TALI_TERMINAL_OK\\n'; printf 'hostname='; cat /etc/hostname; openclaw --version; test -x /usr/local/bin/nemoclaw-start && curl -fsS http://127.0.0.1:18789/health >/dev/null && pgrep -f nemoclaw-start >/dev/null && printf 'NEMOCLAW_RUNTIME_OK\\n'\n"
        : "printf 'TALI_TERMINAL_OK\\nFIXTURE_RUNTIME_OK\\n'\n",
    ),
  );
  socket.on("message", (raw) => {
    output += raw.toString();
    if (
      output.includes("TALI_TERMINAL_OK") &&
      (expectNemoClawRuntime
        ? output.includes(`hostname=${agent.sandboxName}`) &&
          output.includes("OpenClaw 2026.6.10") &&
          /(?:\r\n|\n)NEMOCLAW_RUNTIME_OK\r?\n/.test(output)
        : /(?:\r\n|\n)FIXTURE_RUNTIME_OK\r?\n/.test(output))
    ) {
      clearTimeout(timer);
      socket.close();
      resolve(output);
    }
  });
  socket.on("error", reject);
});

const destroyed = await request(`/api/v1/agents/${agent.id}`, { method: "DELETE" });
const deletedResource = await fetch(`${baseUrl}/api/v1/agents/${agent.id}`, {
  headers: { authorization: `Bearer ${authToken}` },
});
if (destroyed.status !== "DESTROYED" || deletedResource.status !== 404) {
  throw new Error(`Agent delete contract failed: ${JSON.stringify({ destroyed, getStatus: deletedResource.status })}`);
}

console.log(JSON.stringify({
  result: "PASS",
  agentId: agent.id,
  sandboxName: agent.sandboxName,
  status: agent.status,
  runtime: agent.runtime,
  provider: agent.provider,
  terminalEvidence: String(terminalEvidence).replace(/\u001b\[[0-9;?]*[A-Za-z]/g, "").trim(),
  deleteEvidence: `${destroyed.status} / GET ${deletedResource.status}`,
}, null, 2));
