import { createFileRoute } from "@tanstack/react-router";
import { Database } from "lucide-react";
import { EvaluationLayerPageFrame } from "@/features/evaluation-layer/shared/evaluation-page-frame";
import { EvaluationLayerPlaceholder } from "@/features/evaluation-layer/shared/evaluation-placeholder";

export const Route = createFileRoute("/$projectId/evaluation/datasets/")({
  component: EvaluationDatasets,
});

function EvaluationDatasets() {
  return (
    <EvaluationLayerPageFrame title="Dataset" description="Build versioned evaluation cases with deterministic mock data.">
      <EvaluationLayerPlaceholder icon={Database} title="Dataset workspace" description="Cases, schema, import, generation, and publishing will live here." />
    </EvaluationLayerPageFrame>
  );
}
