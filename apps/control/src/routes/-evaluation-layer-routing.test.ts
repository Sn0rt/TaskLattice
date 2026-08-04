import { createMemoryHistory } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { getRouter } from "@/router";

function matchRouteIds(pathname: string) {
  const router = getRouter();
  router.update({
    context: router.options.context,
    history: createMemoryHistory({ initialEntries: [pathname] }),
  });
  return router.matchRoutes(pathname).map((match) => match.routeId);
}

describe("Evaluation layer routes", () => {
  it.each([
    ["/individual/evaluation/targets", "/$projectId/evaluation/targets/"],
    ["/individual/evaluation/datasets", "/$projectId/evaluation/datasets/"],
    ["/individual/evaluation/runs", "/$projectId/evaluation/runs/"],
    ["/individual/evaluation/overview", "/$projectId/evaluation/overview"],
    ["/individual/evaluation/traces", "/$projectId/evaluation/traces/"],
    ["/individual/evaluation/settings", "/$projectId/evaluation/settings"],
  ])("matches %s inside the isolated layout", (pathname, routeId) => {
    const matches = matchRouteIds(pathname);
    expect(matches).toContain("/$projectId/evaluation");
    expect(matches).toContain(routeId);
  });
});
