import { createFileRoute } from "@tanstack/react-router";
import { Waypoints } from "lucide-react";
import { EvaluationLayerPageFrame } from "@/features/evaluation-layer/shared/evaluation-page-frame";
import { EvaluationLayerPlaceholder } from "@/features/evaluation-layer/shared/evaluation-placeholder";

export const Route = createFileRoute("/$projectId/evaluation/traces/")({
  component: EvaluationTraces,
});

function EvaluationTraces() {
  return (
    <EvaluationLayerPageFrame title="Trace" description="Inspect deterministic scores, Tool evidence, judge output, and raw spans.">
      <EvaluationLayerPlaceholder icon={Waypoints} title="Trace analysis" description="The AgentEval trace data hierarchy will be displayed here." />
    </EvaluationLayerPageFrame>
  );
}
