import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DetailCard({
  icon: Icon,
  label,
  mono,
  value,
}: {
  icon?: LucideIcon;
  label: string;
  mono?: boolean;
  value: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          {Icon ? <Icon className="size-4" /> : null}
          {label}
        </CardDescription>
        <CardTitle
          className={mono ? "break-all font-mono text-sm" : "text-base"}
        >
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
