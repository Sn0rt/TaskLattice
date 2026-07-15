import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Agent } from "@tasklattice/contracts";
import { Eye, Pencil, SquareTerminal, Trash2, X } from "lucide-react";
import { AgentStatusBadge } from "@/components/agents/agent-status-badge";
import { Button } from "@/components/ui/button";

export function InstanceDetailDrawer({
  deleting,
  deleteError,
  instance,
  onClose,
  onDelete,
}: {
  deleting: boolean;
  deleteError?: string;
  instance?: Agent;
  onClose: () => void;
  onDelete: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!instance) return;
    setConfirmingDelete(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [instance, onClose]);

  if (!instance) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close Instance actions"
        className="absolute inset-0 bg-foreground/20"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="instance-drawer-title"
        className="animate-in slide-in-from-right absolute inset-y-0 right-0 flex w-[min(92vw,32rem)] flex-col border-l bg-background shadow-[-18px_0_36px_-22px_rgba(15,23,42,0.45)] duration-200"
      >
        <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <AgentStatusBadge status={instance.status} />
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Instance actions</span>
            </div>
            <h2 id="instance-drawer-title" className="mt-3 truncate text-lg font-semibold">{instance.name}</h2>
            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{instance.id}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2"
            aria-label="Close Instance actions"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <dl className="text-xs">
            {[
              ["Runtime", "NemoClaw / OpenClaw"],
              ["Model", instance.model],
              ["OpenShell Sandbox", instance.sandboxName],
              ["Observed", instance.runtimePhase ?? instance.status],
              ["Provider", instance.providerConnectionId],
            ].map(([label, value]) => (
              <div key={label} className="flex min-h-12 items-center justify-between gap-4 border-b">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="max-w-[68%] break-all text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 grid gap-2">
            <Button asChild className="h-11">
              <Link to="/agents/$agentId" params={{ agentId: instance.id }} hash="terminal">
                <SquareTerminal /> Open terminal
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11">
              <Link to="/agents/$agentId" params={{ agentId: instance.id }}>
                <Eye /> View full detail
              </Link>
            </Button>
            <Button variant="outline" className="h-11" disabled>
              <Pencil /> Update Instance
            </Button>
            <p className="text-xs leading-5 text-muted-foreground">
              Update remains disabled until the runtime API can reconcile an edited Agent revision.
            </p>
          </div>

          {confirmingDelete ? (
            <div role="alert" className="mt-6 border-l-2 border-destructive bg-destructive/5 px-3 py-3 text-xs">
              Deleting this Instance also destroys its OpenShell Sandbox. This action cannot be undone.
            </div>
          ) : null}
          {deleteError ? <p role="alert" className="mt-3 text-xs text-destructive">{deleteError}</p> : null}
        </div>

        <footer className="border-t p-5">
          {confirmingDelete ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-11" onClick={() => setConfirmingDelete(false)}>Cancel</Button>
              <Button variant="destructive" className="h-11" disabled={deleting} onClick={onDelete}>
                <Trash2 /> {deleting ? "Deleting…" : "Confirm delete"}
              </Button>
            </div>
          ) : (
            <Button variant="destructive" className="h-11 w-full" onClick={() => setConfirmingDelete(true)}>
              <Trash2 /> Delete Instance
            </Button>
          )}
          <p className="mt-3 text-center text-[11px] text-muted-foreground">Press ESC to close</p>
        </footer>
      </section>
    </div>
  );
}
