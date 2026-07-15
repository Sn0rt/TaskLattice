import { createProviderConnectionSchema } from "@tasklattice/contracts";
import { defineHandler } from "nitro";
import { requireAuth, unauthorizedResponse } from "../../../../auth/auth";
import { errorResponse, jsonResponse } from "../../../../http/responses";
import { getProviderConnectionService } from "../../../../services";

export default defineHandler(async (event) => {
  try {
    requireAuth(event.req);
  } catch (error) {
    return unauthorizedResponse(error);
  }
  try {
    const input = createProviderConnectionSchema.parse(await event.req.json());
    const connection = await (
      await getProviderConnectionService()
    ).register(input);
    return jsonResponse(connection, {
      status: 201,
      headers: { location: `/api/v1/providers/${connection.id}` },
    });
  } catch (error) {
    return errorResponse(error);
  }
});
