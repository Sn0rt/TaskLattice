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

describe("Evaluations routes", () => {
  it("matches Evaluations as a Project index route", () => {
    expect(matchRouteIds("/individual/evaluations")).toContain(
      "/$projectId/evaluations/",
    );
  });

  it("matches a Target detail deep link", () => {
    expect(
      matchRouteIds(
        "/individual/evaluations/targets/target-permission-compliance",
      ),
    ).toContain("/$projectId/evaluations/targets/$targetId");
  });

  it("matches a Dataset detail deep link", () => {
    expect(
      matchRouteIds(
        "/individual/evaluations/datasets/dataset-permission-regression",
      ),
    ).toContain("/$projectId/evaluations/datasets/$datasetId");
  });
});
