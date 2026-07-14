import type { ReactNode } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  disabled,
  label,
  value,
}: {
  disabled?: boolean;
  label: ReactNode;
  value: ReactNode;
}) {
  return (
    <Card className={cn(disabled && "opacity-50")}>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
