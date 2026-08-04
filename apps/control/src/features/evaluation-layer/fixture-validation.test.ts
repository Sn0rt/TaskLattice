import { describe, expect, it } from "vitest";
import { evaluationLayerFixtures } from "./fixtures";
import {
  cloneEvaluationLayerFixtures,
  validateEvaluationLayerState,
} from "./fixture-validation";

describe("Evaluation layer fixtures", () => {
  it("form one valid Target-to-Trace graph", () => {
    expect(validateEvaluationLayerState(evaluationLayerFixtures)).toEqual([]);
    expect(evaluationLayerFixtures.targets).not.toHaveLength(0);
    expect(
      evaluationLayerFixtures.traces.some((trace) => trace.spans.length > 0),
    ).toBe(true);
  });

  it("clone into isolated in-memory graphs", () => {
    const first = cloneEvaluationLayerFixtures();
    const second = cloneEvaluationLayerFixtures();
    first.targets[0]!.name = "Changed only here";
    expect(second.targets[0]!.name).not.toBe("Changed only here");
  });

  it("reports a broken trace-to-run reference with a stable path", () => {
    const state = cloneEvaluationLayerFixtures();
    state.traces[0]!.runId = "missing-run";
    expect(validateEvaluationLayerState(state)).toContain(
      `traces.${state.traces[0]!.id}.runId: missing-run`,
    );
  });
});
