import type { ReactNode } from "react";

interface PageHeaderProps {
  actions?: ReactNode;
  badge?: ReactNode;
  description?: ReactNode;
  eyebrow: string;
  title: string;
}

export function PageHeader({
  actions,
  badge,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {eyebrow}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {badge}
        </div>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions}
    </header>
  );
}
