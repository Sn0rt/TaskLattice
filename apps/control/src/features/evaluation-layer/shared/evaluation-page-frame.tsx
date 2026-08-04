import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";

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
  return (
    <section className="space-y-6 max-sm:[&_[data-slot=button]]:min-h-11 max-sm:[&_select]:min-h-11">
      <PageHeader
        title={title}
        description={description}
        badge={<Badge variant="outline">Mock demo</Badge>}
        actions={action}
      />
      {children}
    </section>
  );
}
