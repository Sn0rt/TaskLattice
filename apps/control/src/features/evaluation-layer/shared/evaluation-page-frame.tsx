import type { ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEvaluationLayerStore } from "../mock-provider";

export function EvaluationLayerPageFrame({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  const store = useEvaluationLayerStore();
  return (
    <section className="space-y-6 max-sm:[&_[data-slot=button]]:min-h-11 max-sm:[&_select]:min-h-11">
      <PageHeader
        title={title}
        description={description}
        badge={<Badge variant="outline">Mock demo</Badge>}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {action}
            <Button variant="outline" onClick={() => store.resetDemo()}>
              <RotateCcw className="size-4" />
              Reset demo
            </Button>
          </div>
        }
      />
      {children}
    </section>
  );
}
