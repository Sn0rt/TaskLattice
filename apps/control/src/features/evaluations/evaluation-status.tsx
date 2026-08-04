import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CaseStatus, EvaluationStatus } from "./model";

const statusStyles: Record<EvaluationStatus | CaseStatus, string> = {
  DRAFT: "border-slate-300 bg-slate-50 text-slate-700",
  QUEUED: "border-blue-300 bg-blue-50 text-blue-700",
  RUNNING: "border-blue-300 bg-blue-50 text-blue-700",
  PASS: "border-emerald-300 bg-emerald-50 text-emerald-700",
  FAIL: "border-rose-300 bg-rose-50 text-rose-700",
  PENDING: "border-slate-300 bg-slate-50 text-slate-700",
  BLOCKED: "border-amber-300 bg-amber-50 text-amber-700",
};

export function EvaluationStatusBadge({
  status,
}: {
  status: EvaluationStatus | CaseStatus;
}) {
  return (
    <Badge variant="outline" className={cn("font-mono", statusStyles[status])}>
      {status}
    </Badge>
  );
}
