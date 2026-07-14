export function UnavailableAction({ label }: { label: string }) {
  return (
    <button
      disabled
      className="w-full cursor-not-allowed rounded-md border bg-muted py-2 text-xs text-muted-foreground/50"
    >
      {label} · Later
    </button>
  );
}
