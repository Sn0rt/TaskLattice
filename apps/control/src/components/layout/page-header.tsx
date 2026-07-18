import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  actions?: ReactNode;
  badge?: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  title?: string;
}

export function PageHeader({
  actions,
  badge,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  const hasHeading = Boolean(eyebrow || title || badge);
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
      <div>
        {eyebrow ? (
          <p className="text-xs font-medium text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        {title || badge ? (
          <div className={cn("flex flex-wrap items-center gap-3", eyebrow && "mt-2")}>
            {title ? <h1 className="text-3xl font-semibold tracking-tight">{title}</h1> : null}
            {badge}
          </div>
        ) : null}
        {description ? (
          <p className={cn("max-w-2xl text-sm text-muted-foreground", hasHeading && "mt-2")}>
            {description}
          </p>
        ) : null}
      </div>
      {actions}
    </header>
  );
}
