import { createFileRoute } from "@tanstack/react-router";
import { Settings2 } from "lucide-react";
import { EvaluationLayerPageFrame } from "@/features/evaluation-layer/shared/evaluation-page-frame";
import { EvaluationLayerPlaceholder } from "@/features/evaluation-layer/shared/evaluation-placeholder";

export const Route = createFileRoute("/$projectId/evaluation/settings")({
  component: EvaluationSettings,
});

function EvaluationSettings() {
  return (
    <EvaluationLayerPageFrame title="Settings" description="Configure the frontend-only judge provider used by this mock demo.">
      <EvaluationLayerPlaceholder icon={Settings2} title="Evaluation settings" description="Provider, model, connection test, and evaluator toggles will be displayed here." />
    </EvaluationLayerPageFrame>
  );
}
