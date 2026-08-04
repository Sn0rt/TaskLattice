import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { EvaluationLayerPageFrame } from "@/features/evaluation-layer/shared/evaluation-page-frame";
import { EvaluationLayerPlaceholder } from "@/features/evaluation-layer/shared/evaluation-placeholder";

export const Route = createFileRoute("/$projectId/evaluation/runs/")({
  component: EvaluationRuns,
});

function EvaluationRuns() {
  return (
    <EvaluationLayerPageFrame title="Evaluation" description="Run a version-pinned Agent evaluation and review live mock progress.">
      <EvaluationLayerPlaceholder icon={FlaskConical} title="Evaluation runs" description="Run creation, progress, Report, and Reflection will be displayed here." />
    </EvaluationLayerPageFrame>
  );
}
