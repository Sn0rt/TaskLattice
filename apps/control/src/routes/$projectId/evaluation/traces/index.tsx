import { createFileRoute } from "@tanstack/react-router";
import { EvaluationLayerPageFrame } from "@/features/evaluation-layer/shared/evaluation-page-frame";
import { EvaluationTraceList } from "@/features/evaluation-layer/traces/trace-pages";

export const Route = createFileRoute("/$projectId/evaluation/traces/")({
  component: EvaluationTraces,
});

function EvaluationTraces() {
  return (
    <EvaluationLayerPageFrame title="Trace" description="Inspect deterministic scores, Tool evidence, judge output, and raw spans.">
      <EvaluationTraceList />
    </EvaluationLayerPageFrame>
  );
}
