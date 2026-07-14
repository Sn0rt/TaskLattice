const json = (schema: object) => ({
  content: { "application/json": { schema } },
});

const agentId = {
  name: "agentId",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
} as const;

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "TaskLattice API",
    version: "0.1.0",
    description: "REST API for provisioning NemoClaw Agents and opening short-lived terminal sessions.",
  },
  servers: [{ url: "/api/v1" }],
  security: [{ bearerAuth: [] }],
  paths: {
    "/auth/config": {
      get: {
        operationId: "getAuthConfig",
        security: [],
        summary: "Read public authentication capabilities",
        responses: {
          "200": { description: "Authentication capabilities", ...json({ $ref: "#/components/schemas/AuthConfig" }) },
        },
      },
    },
    "/auth/local": {
      post: {
        operationId: "localLogin",
        security: [],
        summary: "Exchange local credentials for a TaskLattice bearer token",
        requestBody: { required: true, ...json({ $ref: "#/components/schemas/LocalLoginInput" }) },
        responses: {
          "200": { description: "Authenticated session", ...json({ $ref: "#/components/schemas/AuthSession" }) },
          "401": { $ref: "#/components/responses/Error" },
        },
      },
    },
    "/auth/me": {
      get: {
        operationId: "getCurrentUser",
        summary: "Resolve the current bearer identity",
        responses: {
          "200": { description: "Current identity", ...json({ $ref: "#/components/schemas/CurrentUser" }) },
          "401": { $ref: "#/components/responses/Error" },
        },
      },
    },
    "/auth/logout": {
      post: {
        operationId: "logout",
        summary: "Resolve optional provider logout before client token removal",
        responses: {
          "200": { description: "Logout result", ...json({ type: "object", required: ["message"], properties: { message: { type: "string" }, redirectUrl: { type: "string", format: "uri" } } }) },
        },
      },
    },
    "/auth/sso/start": {
      get: {
        operationId: "startSso",
        security: [],
        summary: "Start OIDC Authorization Code with PKCE",
        responses: {
          "302": { description: "Redirect to the configured OIDC provider" },
          "404": { $ref: "#/components/responses/Error" },
        },
      },
    },
    "/providers": {
      get: {
        operationId: "listProviders",
        summary: "List supported model providers",
        responses: {
          "200": { description: "Provider catalog", ...json({ $ref: "#/components/schemas/ProviderCollection" }) },
        },
      },
    },
    "/agents": {
      get: {
        operationId: "listAgents",
        summary: "List Agents",
        responses: {
          "200": { description: "Agent collection", ...json({ $ref: "#/components/schemas/AgentCollection" }) },
        },
      },
      post: {
        operationId: "createAgent",
        summary: "Create a NemoClaw Agent",
        requestBody: { required: true, ...json({ $ref: "#/components/schemas/CreateAgentInput" }) },
        responses: {
          "202": { description: "Provisioning accepted", headers: { Location: { schema: { type: "string" } } }, ...json({ $ref: "#/components/schemas/Agent" }) },
          "400": { $ref: "#/components/responses/Error" },
        },
      },
    },
    "/agents/{agentId}": {
      parameters: [agentId],
      get: {
        operationId: "getAgent",
        summary: "Read an Agent and reconcile its runtime state",
        responses: {
          "200": { description: "Agent", ...json({ $ref: "#/components/schemas/Agent" }) },
          "404": { $ref: "#/components/responses/Error" },
        },
      },
      delete: {
        operationId: "deleteAgent",
        summary: "Destroy an Agent and its NemoClaw sandbox",
        responses: {
          "202": { description: "Sandbox destroyed and resource removed", ...json({ $ref: "#/components/schemas/DeleteAgentResult" }) },
          "404": { $ref: "#/components/responses/Error" },
        },
      },
    },
    "/agents/{agentId}/terminal-sessions": {
      parameters: [agentId],
      post: {
        operationId: "createTerminalSession",
        summary: "Create a short-lived, single-use terminal session",
        responses: {
          "201": { description: "Terminal session", ...json({ $ref: "#/components/schemas/TerminalSession" }) },
          "404": { $ref: "#/components/responses/Error" },
          "409": { $ref: "#/components/responses/Error" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      AuthConfig: {
        type: "object",
        required: ["authRequired", "developmentDefaults", "localEnabled", "mode", "providerName", "ssoEnabled"],
        properties: {
          authRequired: { type: "boolean", const: true },
          developmentDefaults: { type: "boolean" },
          localEnabled: { type: "boolean", const: true },
          mode: { type: "string", enum: ["local", "local-sso"] },
          providerName: { type: "string" },
          ssoEnabled: { type: "boolean" },
        },
      },
      AuthUser: {
        type: "object",
        required: ["displayName", "email", "provider", "username"],
        properties: {
          displayName: { type: "string" },
          email: { type: "string" },
          provider: { type: "string", enum: ["local", "sso"] },
          username: { type: "string" },
        },
      },
      LocalLoginInput: {
        type: "object",
        additionalProperties: false,
        required: ["password", "username"],
        properties: {
          password: { type: "string" },
          remember: { type: "boolean", default: false },
          username: { type: "string" },
        },
      },
      AuthSession: {
        type: "object",
        required: ["expiresAt", "token", "user"],
        properties: {
          expiresAt: { type: "string", format: "date-time" },
          token: { type: "string" },
          user: { $ref: "#/components/schemas/AuthUser" },
        },
      },
      CurrentUser: {
        type: "object",
        required: ["identity", "user"],
        properties: {
          identity: { type: "object", required: ["type", "username"], properties: { type: { type: "string", const: "authenticated" }, username: { type: "string" } } },
          user: { $ref: "#/components/schemas/AuthUser" },
        },
      },
      CreateAgentInput: {
        type: "object",
        additionalProperties: false,
        required: ["name", "runtime", "provider", "model", "systemPrompt"],
        properties: {
          name: { type: "string", minLength: 3, maxLength: 48 },
          description: { type: "string", maxLength: 240, default: "" },
          runtime: { type: "string", const: "nemoclaw" },
          provider: { type: "string", const: "deepseek" },
          model: { type: "string", enum: ["deepseek-chat", "deepseek-reasoner"] },
          systemPrompt: { type: "string", minLength: 10, maxLength: 8000 },
        },
      },
      Agent: {
        allOf: [
          { $ref: "#/components/schemas/CreateAgentInput" },
          {
            type: "object",
            required: ["id", "sandboxName", "status", "createdAt", "updatedAt", "logs"],
            properties: {
              id: { type: "string", format: "uuid" },
              sandboxName: { type: "string" },
              status: { type: "string", enum: ["PROVISIONING", "READY", "FAILED", "DESTROYING"] },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
              operationId: { type: "string" },
              runtimePhase: { type: "string" },
              logs: { type: "array", items: { type: "string" } },
              error: { type: "string" },
            },
          },
        ],
      },
      Provider: {
        type: "object",
        required: ["id", "name", "library", "models", "credentialSource"],
        properties: {
          id: { type: "string", const: "deepseek" },
          name: { type: "string" },
          library: { type: "string", const: "@ai-sdk/deepseek" },
          models: { type: "array", items: { type: "string", enum: ["deepseek-chat", "deepseek-reasoner"] } },
          credentialSource: { type: "string" },
        },
      },
      ProviderCollection: {
        type: "object",
        required: ["data"],
        properties: { data: { type: "array", items: { $ref: "#/components/schemas/Provider" } } },
      },
      AgentCollection: {
        type: "object",
        required: ["data"],
        properties: { data: { type: "array", items: { $ref: "#/components/schemas/Agent" } } },
      },
      TerminalSession: {
        type: "object",
        required: ["id", "expiresAt", "websocketUrl"],
        properties: {
          id: { type: "string", format: "uuid" },
          expiresAt: { type: "string", format: "date-time" },
          websocketUrl: { type: "string", description: "Relative WebSocket upgrade path; valid once for five minutes." },
        },
      },
      DeleteAgentResult: {
        type: "object",
        required: ["id", "status", "previousStatus"],
        properties: {
          id: { type: "string", format: "uuid" },
          status: { type: "string", const: "DESTROYED" },
          previousStatus: { type: "string", const: "DESTROYING" },
        },
      },
      Error: { type: "object", required: ["error"], properties: { error: { type: "string" } } },
    },
    responses: {
      Error: { description: "Request failed", ...json({ $ref: "#/components/schemas/Error" }) },
    },
  },
} as const;
