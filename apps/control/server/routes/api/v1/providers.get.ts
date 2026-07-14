import { defineHandler } from "nitro";
import { requireAuth, unauthorizedResponse } from "../../../auth/auth";
import { jsonResponse } from "../../../http/responses";
import { getAgentService } from "../../../services";

export default defineHandler(async (event) => {
  try {
    requireAuth(event.req);
  } catch (error) {
    return unauthorizedResponse(error);
  }
  const service = await getAgentService();
  return jsonResponse({
    data: [
      {
        id: "deepseek",
        name: "DeepSeek",
        library: "@ai-sdk/deepseek",
        models: ["deepseek-chat", "deepseek-reasoner"],
        credentialSource: service.store.getProviderCredential("deepseek")
          ? "control-database-test"
          : "runtime-host",
      },
    ],
  });
});
