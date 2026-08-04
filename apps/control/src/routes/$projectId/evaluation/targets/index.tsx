import { createFileRoute } from "@tanstack/react-router";
import { Target } from "lucide-react";
import { EvaluationLayerPageFrame } from "@/features/evaluation-layer/shared/evaluation-page-frame";
import { EvaluationLayerPlaceholder } from "@/features/evaluation-layer/shared/evaluation-placeholder";

export const Route = createFileRoute("/$projectId/evaluation/targets/")({
  component: EvaluationTargets,
});

function EvaluationTargets() {
  return (
    <EvaluationLayerPageFrame title="Target" description="Configure the Agent revisions evaluated by this frontend-only demo.">
      <EvaluationLayerPlaceholder icon={Target} title="Target workspace" description="Target list and revision history are ready to be displayed." />
    </EvaluationLayerPageFrame>
  );
}
