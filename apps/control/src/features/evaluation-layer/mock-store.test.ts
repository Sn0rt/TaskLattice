import { describe, expect, it } from "vitest";
import { cloneEvaluationLayerFixtures } from "./fixture-validation";
import { createEvaluationLayerStore } from "./mock-store";

describe("EvaluationLayerStore", () => {
  it("publishes a Dataset revision without mutating the draft source", () => {
    const store = createEvaluationLayerStore(cloneEvaluationLayerFixtures(), {
      id: () => "dataset-revision-new",
      now: () => "2026-08-04T10:00:00.000Z",
    });
    const dataset = store.getState().datasets[0]!;
    const draft = store
      .getState()
      .datasetRevisions.find(
        (revision) =>
          revision.datasetId === dataset.id && revision.status === "DRAFT",
      )!;
    const before = structuredClone(draft);

    const result = store.publishDatasetRevision(dataset.id);

    expect(result).toEqual({
      ok: true,
      value: { revisionId: "dataset-revision-new" },
    });
    expect(draft).toEqual(before);
    expect(store.getState().datasets[0]?.currentRevisionId).toBe(
      "dataset-revision-new",
    );
  });

  it("resets one demo store without touching another", () => {
    const first = createEvaluationLayerStore(cloneEvaluationLayerFixtures());
    const second = createEvaluationLayerStore(cloneEvaluationLayerFixtures());
    first.markTraceFailed(first.getState().traces[0]!.id, true);

    first.resetDemo();

    expect(first.getState()).toEqual(cloneEvaluationLayerFixtures());
    expect(second.getState()).toEqual(cloneEvaluationLayerFixtures());
  });
});
