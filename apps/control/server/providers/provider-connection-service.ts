import { randomUUID } from "node:crypto";
import type {
  CreateProviderConnectionInput,
  ProviderConnection,
  ProviderConnectionValidationCheck,
} from "@tasklattice/contracts";
import { AgentStore } from "../data/agent-store";
import {
  PiProviderValidator,
  type ProviderValidator,
} from "./pi-provider-validator";

export const localDeepSeekConnectionId =
  "provider-deepseek-local-validated";

const failedChecks = (): ProviderConnectionValidationCheck[] => [
  { id: "endpoint", label: "Endpoint reachability", status: "FAIL" },
  { id: "model", label: "Pi model registration", status: "PASS" },
  { id: "credentials", label: "Credential scope", status: "FAIL" },
  { id: "inference", label: "Minimal inference", status: "FAIL" },
];

export class ProviderConnectionService {
  constructor(
    readonly store = new AgentStore(),
    readonly validator: ProviderValidator = new PiProviderValidator(),
  ) {}

  list(): ProviderConnection[] {
    return this.store.listProviderConnections();
  }

  async register(
    input: CreateProviderConnectionInput,
  ): Promise<ProviderConnection> {
    const now = new Date().toISOString();
    const connection: ProviderConnection = {
      id: randomUUID(),
      name: input.name,
      provider: input.provider,
      endpoint: input.endpoint,
      model: input.model,
      inputFeePerMillionTokens: input.inputFeePerMillionTokens,
      outputFeePerMillionTokens: input.outputFeePerMillionTokens,
      credentialState: "STORED",
      status: "FAILED",
      checks: failedChecks(),
      validationMessage: "Validation has not completed.",
      createdAt: now,
      updatedAt: now,
    };
    this.store.saveProviderConnection(connection, input.apiKey);
    return this.validateConnection(connection, input.apiKey);
  }

  async revalidate(id: string): Promise<ProviderConnection | undefined> {
    const connection = this.store.getProviderConnection(id);
    const apiKey = this.store.getProviderConnectionCredential(id);
    if (!connection || !apiKey) return undefined;
    return this.validateConnection(connection, apiKey);
  }

  seedLocalValidated(apiKey: string): ProviderConnection {
    const existing = this.store.getProviderConnection(
      localDeepSeekConnectionId,
    );
    if (existing) return existing;
    const now = new Date().toISOString();
    return this.store.saveProviderConnection(
      {
        id: localDeepSeekConnectionId,
        name: "DeepSeek local runtime",
        provider: "deepseek",
        endpoint: "https://api.deepseek.com",
        model: "deepseek-chat",
        inputFeePerMillionTokens: 0,
        outputFeePerMillionTokens: 0,
        credentialState: "STORED",
        status: "VALIDATED",
        checks: [
          { id: "endpoint", label: "Endpoint reachability", status: "PASS" },
          { id: "model", label: "Pi model registration", status: "PASS" },
          { id: "credentials", label: "Credential scope", status: "PASS" },
          { id: "inference", label: "Minimal inference", status: "PASS" },
        ],
        validationMessage:
          "Validated by the local OpenShell startup proof path.",
        validationLatencyMs: 0,
        validatedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      apiKey,
    );
  }

  private async validateConnection(
    connection: ProviderConnection,
    apiKey: string,
  ): Promise<ProviderConnection> {
    try {
      const result = await this.validator.validate({
        name: connection.name,
        provider: connection.provider,
        endpoint: connection.endpoint,
        model: connection.model,
        inputFeePerMillionTokens: connection.inputFeePerMillionTokens,
        outputFeePerMillionTokens: connection.outputFeePerMillionTokens,
        apiKey,
      });
      const now = new Date().toISOString();
      return this.store.saveProviderConnection({
        ...connection,
        status: "VALIDATED",
        checks: result.checks,
        validationMessage: result.message,
        validationLatencyMs: result.latencyMs,
        validatedAt: now,
        updatedAt: now,
      });
    } catch (error) {
      return this.store.saveProviderConnection({
        ...connection,
        status: "FAILED",
        checks: failedChecks(),
        validationMessage:
          error instanceof Error
            ? error.message
            : "Pi provider validation failed.",
        updatedAt: new Date().toISOString(),
      });
    }
  }
}
