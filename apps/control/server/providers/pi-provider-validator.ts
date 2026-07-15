import { createModels, type Model } from "@earendil-works/pi-ai";
import { deepseekProvider } from "@earendil-works/pi-ai/providers/deepseek";
import type {
  CreateProviderConnectionInput,
  ProviderConnectionValidationCheck,
} from "@tasklattice/contracts";

export interface ProviderValidationResult {
  checks: ProviderConnectionValidationCheck[];
  latencyMs: number;
  message: string;
}

export interface ProviderValidator {
  validate(
    input: CreateProviderConnectionInput,
  ): Promise<ProviderValidationResult>;
}

function normalizedBaseUrl(endpoint: string): string {
  return endpoint.replace(/\/+$/, "").replace(/\/chat\/completions$/, "");
}

const passedChecks = (): ProviderConnectionValidationCheck[] => [
  { id: "endpoint", label: "Endpoint reachability", status: "PASS" },
  { id: "model", label: "Pi model registration", status: "PASS" },
  { id: "credentials", label: "Credential scope", status: "PASS" },
  { id: "inference", label: "Minimal inference", status: "PASS" },
];

export class PiProviderValidator implements ProviderValidator {
  async validate(
    input: CreateProviderConnectionInput,
  ): Promise<ProviderValidationResult> {
    const provider = deepseekProvider();
    const template = provider.getModels()[0];
    if (!template)
      throw new Error("Pi did not expose a DeepSeek model template.");

    const model: Model<"openai-completions"> = {
      ...template,
      id: input.model,
      name: input.model,
      provider: input.provider,
      baseUrl: normalizedBaseUrl(input.endpoint),
      reasoning: input.model === "deepseek-reasoner",
    };
    const models = createModels();
    models.setProvider(provider);
    const startedAt = Date.now();
    const response = await models.complete(
      model,
      {
        messages: [
          {
            role: "user",
            content: "Reply with OK.",
            timestamp: Date.now(),
          },
        ],
      },
      {
        apiKey: input.apiKey,
        maxTokens: 1,
        maxRetries: 0,
        signal: AbortSignal.timeout(12_000),
        timeoutMs: 10_000,
      },
    );
    if (response.stopReason === "error" || response.errorMessage)
      throw new Error(
        response.errorMessage ?? "Pi provider validation failed.",
      );
    return {
      checks: passedChecks(),
      latencyMs: Date.now() - startedAt,
      message: `Pi validated ${input.provider}/${input.model} with a minimal backend inference.`,
    };
  }
}
