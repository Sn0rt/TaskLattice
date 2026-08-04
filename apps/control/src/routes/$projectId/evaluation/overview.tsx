import { createFileRoute } from "@tanstack/react-router";
import { ChartNoAxesCombined } from "lucide-react";
import { EvaluationLayerPageFrame } from "@/features/evaluation-layer/shared/evaluation-page-frame";
import { EvaluationLayerPlaceholder } from "@/features/evaluation-layer/shared/evaluation-placeholder";

export const Route = createFileRoute("/$projectId/evaluation/overview")({
  component: EvaluationOverview,
});

function EvaluationOverview() {
  return (
    <EvaluationLayerPageFrame title="Overview" description="Compare quality, failure patterns, latency, and cost across mock runs.">
      <EvaluationLayerPlaceholder icon={ChartNoAxesCombined} title="Evaluation overview" description="Metrics, charts, and failure summaries will be displayed here." />
    </EvaluationLayerPageFrame>
  );
}
