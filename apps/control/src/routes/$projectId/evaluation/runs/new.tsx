import { createFileRoute } from "@tanstack/react-router";
import { EvaluationRunSetup } from "@/features/evaluation-layer/runs/run-pages";
import { EvaluationLayerPageFrame } from "@/features/evaluation-layer/shared/evaluation-page-frame";

export const Route = createFileRoute("/$projectId/evaluation/runs/new")({ component: NewEvaluationRoute });
function NewEvaluationRoute() { return <EvaluationLayerPageFrame title="New Evaluation" description="Pin Agent and Policy revisions, choose evaluators, and start a deterministic run."><EvaluationRunSetup /></EvaluationLayerPageFrame>; }
