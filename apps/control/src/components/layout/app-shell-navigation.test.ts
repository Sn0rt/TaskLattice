import { describe, expect, it } from "vitest";
import { itemIsActive, projectNavGroups } from "./app-shell";

describe("Evaluation navigation", () => {
  it("adds the isolated group in AgentEval order and keeps Observer minimal", () => {
    expect(
      projectNavGroups
        .find((group) => group.label === "Evaluation")
        ?.items.map((item) => item.label),
    ).toEqual(["Agent", "Dataset", "Evaluation", "Overview", "Trace"]);
    expect(
      projectNavGroups
        .find((group) => group.label === "Observer")
        ?.items.map((item) => item.label),
    ).toEqual(["Traces", "Cost"]);
  });

  it("keeps active state scoped to the selected Evaluation child", () => {
    const group = projectNavGroups.find((item) => item.label === "Evaluation")!;
    const target = group.items[0]!;
    const dataset = group.items[1]!;
    expect(itemIsActive(target, "/individual/evaluation/targets/demo", "individual")).toBe(true);
    expect(itemIsActive(dataset, "/individual/evaluation/targets/demo", "individual")).toBe(false);
  });
});
