import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { AgentStatusBadge } from "@/components/agents/agent-status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Boxes } from "lucide-react";

export const Route = createFileRoute("/instances")({ component: Instances });

function Instances() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const agents = useQuery({
    queryKey: ["agents"],
    queryFn: api.listAgents,
    refetchInterval: 2_000,
  });
  const filtered = useMemo(
    () =>
      (agents.data ?? []).filter((agent) =>
        `${agent.name} ${agent.id} ${agent.sandboxName}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [agents.data, query],
  );
  const selected =
    filtered.find((agent) => agent.id === selectedId) ?? filtered[0];

  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected, selectedId]);

  const remove = useMutation({
    mutationFn: api.deleteAgent,
    onSuccess: async () => {
      setConfirmingDelete(false);
      setSelectedId(undefined);
      await queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Instance"
        title="Instances"
        description="Query the live instance list, select one item, then view, update, or delete that resource."
        actions={
          <Button asChild className="h-11">
            <Link to="/agents/new">
              <Plus /> Create Instance
            </Link>
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Instance list</CardTitle>
                <CardDescription className="mt-1">
                  {filtered.length} visible item{filtered.length === 1 ? "" : "s"}
                </CardDescription>
              </div>
              <label className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <span className="sr-only">Search instances</span>
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search instances"
                  className="h-11 pl-9"
                />
              </label>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {filtered.length ? (
              <>
                <div className="hidden grid-cols-[minmax(0,1.4fr)_1fr_0.7fr_auto] gap-3 border-b px-4 py-2 text-xs text-muted-foreground sm:grid">
                  <span>Instance</span>
                  <span>Sandbox</span>
                  <span>Updated</span>
                  <span>Status</span>
                </div>
                {filtered.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    aria-pressed={selected?.id === agent.id}
                    onClick={() => {
                      setSelectedId(agent.id);
                      setConfirmingDelete(false);
                    }}
                    className={cn(
                      "grid min-h-16 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-muted/45 focus-visible:outline-2 focus-visible:outline-offset-[-2px] sm:grid-cols-[minmax(0,1.4fr)_1fr_0.7fr_auto]",
                      selected?.id === agent.id &&
                        "bg-muted/70 shadow-[inset_3px_0_0_var(--foreground)]",
                    )}
                  >
                    <span className="min-w-0">
                      <strong className="block truncate font-medium">
                        {agent.name}
                      </strong>
                      <span className="mt-1 block truncate font-mono text-xs text-muted-foreground">
                        {agent.id.slice(0, 8)}
                      </span>
                    </span>
                    <span className="hidden truncate font-mono text-xs sm:block">
                      {agent.sandboxName}
                    </span>
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      {new Date(agent.updatedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <AgentStatusBadge status={agent.status} />
                  </button>
                ))}
              </>
            ) : (
              <EmptyState
                icon={Boxes}
                title="No matching instances"
                description="Adjust the query or create a new instance."
              />
            )}
          </CardContent>
        </Card>

        {selected ? (
          <Card className="xl:sticky xl:top-24">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between gap-3">
                <AgentStatusBadge status={selected.status} />
                <span className="text-xs text-muted-foreground">Selected item</span>
              </div>
              <CardTitle className="mt-3">{selected.name}</CardTitle>
              <CardDescription className="font-mono text-xs">
                {selected.id}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="text-xs">
                {[
                  ["Runtime", "NemoClaw / OpenClaw"],
                  ["Model", selected.model],
                  ["Sandbox", selected.sandboxName],
                  ["Observed", selected.runtimePhase ?? selected.status],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex min-h-10 items-center justify-between gap-3 border-b"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="max-w-[65%] break-all text-right font-medium">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              {confirmingDelete ? (
                <div role="alert" className="border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-xs">
                  Deleting this item also destroys its runtime Sandbox. This
                  action cannot be undone.
                </div>
              ) : null}
              {remove.error ? (
                <p role="alert" className="text-xs text-destructive">
                  {remove.error.message}
                </p>
              ) : null}
              <div className="grid gap-2">
                <Button asChild className="h-11">
                  <Link
                    to="/agents/$agentId"
                    params={{ agentId: selected.id }}
                  >
                    <Eye /> View selected
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-11"
                  disabled
                >
                  <Pencil /> Update selected
                </Button>
                <p className="text-xs leading-5 text-muted-foreground">
                  Update remains disabled because the current runtime API does
                  not reconcile an edited Agent revision yet.
                </p>
                {confirmingDelete ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="h-11"
                      onClick={() => setConfirmingDelete(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      className="h-11"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(selected.id)}
                    >
                      <Trash2 />
                      {remove.isPending ? "Deleting…" : "Confirm delete"}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="destructive"
                    className="h-11"
                    onClick={() => setConfirmingDelete(true)}
                  >
                    <Trash2 /> Delete selected
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
