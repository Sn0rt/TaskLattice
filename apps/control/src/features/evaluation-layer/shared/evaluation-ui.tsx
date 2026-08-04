import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function EvaluationMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      {detail ? <CardContent className="text-xs text-muted-foreground">{detail}</CardContent> : null}
    </Card>
  );
}

export function EvaluationSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function EvaluationTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/65 bg-card">
      <table className="w-full min-w-[760px] border-collapse text-sm [&_td]:border-t [&_td]:border-border/60 [&_td]:px-4 [&_td]:py-3 [&_th]:bg-muted/35 [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
        {children}
      </table>
    </div>
  );
}

export function KeyValueGrid({
  items,
  className,
}: {
  items: Array<[string, ReactNode]>;
  className?: string;
}) {
  return (
    <dl className={cn("grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map(([label, value]) => (
        <div key={label} className="bg-card p-4">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="mt-1 break-words font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function JsonPreview({ value }: { value: unknown }) {
  return (
    <pre className="max-h-72 overflow-auto rounded-md border bg-muted/35 p-3 font-mono text-xs leading-5">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function formatCost(value: number) {
  return `$${value.toFixed(4)}`;
}
