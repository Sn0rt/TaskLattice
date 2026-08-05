import { describe, expect, it } from "vitest";
import type { ProjectRole } from "@/types/project";
import { itemIsActive, navItemVisibleForRole, projectNavGroups } from "./app-shell";

function visibleLabels(groupLabel: string, role: ProjectRole) {
  return projectNavGroups
    .find((group) => group.label === groupLabel)!
    .items.filter((item) => navItemVisibleForRole(item, role))
    .map((item) => item.label);
}

describe("Evaluation navigation", () => {
  it("keeps Evaluation operator-only and moves the merged Overview to Observer", () => {
    expect(
      projectNavGroups
        .find((group) => group.label === "Evaluation")
        ?.items.map((item) => item.label),
    ).toEqual(["Agent", "Test Case", "Evaluation"]);
    expect(
      projectNavGroups
        .find((group) => group.label === "Observer")
        ?.items.map((item) => item.label),
    ).toEqual(["Traces", "Overview", "Cost"]);
  });

  it("keeps active state scoped to the selected Evaluation child", () => {
    const group = projectNavGroups.find((item) => item.label === "Evaluation")!;
    const target = group.items[0]!;
    const dataset = group.items[1]!;
    expect(itemIsActive(target, "/individual/evaluation/targets/demo", "individual")).toBe(true);
    expect(itemIsActive(dataset, "/individual/evaluation/targets/demo", "individual")).toBe(false);
  });
});

describe("Role-based navigation whitelist", () => {
  it("shows every item to admin and member", () => {
    for (const role of ["admin", "member"] as const) {
      for (const group of projectNavGroups) {
        expect(visibleLabels(group.label, role)).toEqual(
          group.items.map((item) => item.label),
        );
      }
    }
  });

  it("restricts compliance to policy, behavior, and traceability surfaces", () => {
    expect(visibleLabels("Agentic", "compliance")).toEqual([]);
    expect(visibleLabels("Evaluation", "compliance")).toEqual([]);
    expect(visibleLabels("Security", "compliance")).toEqual([
      "Access Policies",
      "Runtime Policies",
      "Audit Logs",
    ]);
    expect(visibleLabels("Observer", "compliance")).toEqual([
      "Traces",
      "Overview",
    ]);
  });
});
