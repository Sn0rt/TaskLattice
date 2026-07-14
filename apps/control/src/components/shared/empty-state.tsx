import type { LucideIcon } from "lucide-react";

export function EmptyState({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed py-16 text-center">
      <Icon className="mb-4 size-9 text-muted-foreground" />
      <h2 className="font-medium">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
