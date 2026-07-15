import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  CircleX,
  KeyRound,
  Plus,
  PlugZap,
  RefreshCw,
  Server,
  ShieldCheck,
  X,
} from "lucide-react";
import type {
  AgentModel,
  ProviderConnection,
} from "@tasklattice/contracts";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusDot } from "@/components/shared/status-dot";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/providers")({
  component: ProvidersPage,
});

const initialForm = {
  name: "DeepSeek production",
  endpoint: "https://api.deepseek.com",
  model: "deepseek-chat" as AgentModel,
  apiKey: "",
};

function ProvidersPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const connections = useQuery({
    queryKey: ["provider-connections"],
    queryFn: api.listProviderConnections,
    refetchInterval: 30_000,
  });
  const selected = connections.data?.find(
    (connection) => connection.id === selectedId,
  );

  useEffect(() => {
    if (!selectedId && connections.data?.[0])
      setSelectedId(connections.data[0].id);
  }, [connections.data, selectedId]);

  const register = useMutation({
    mutationFn: api.registerProviderConnection,
    onSuccess: async (connection) => {
      setSelectedId(connection.id);
      await queryClient.invalidateQueries({
        queryKey: ["provider-connections"],
      });
      if (connection.status === "VALIDATED") {
        setForm(initialForm);
        setRegisterOpen(false);
      } else {
        setForm((current) => ({ ...current, apiKey: "" }));
      }
    },
  });
  const revalidate = useMutation({
    mutationFn: api.revalidateProviderConnection,
    onSuccess: async () =>
      queryClient.invalidateQueries({
        queryKey: ["provider-connections"],
      }),
  });
  const closeRegistration = useCallback(() => {
    if (!register.isPending) setRegisterOpen(false);
  }, [register.isPending]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    register.mutate({
      name: form.name,
      provider: "deepseek",
      endpoint: form.endpoint,
      model: form.model,
      apiKey: form.apiKey,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Provider registry"
        title="Providers"
        description="Inspect model connections that are already available to Instances. Register a new Endpoint only when the platform needs another Provider."
        actions={
          <Button
            className="h-11"
            onClick={() => {
              register.reset();
              setRegisterOpen(true);
            }}
          >
            <Plus /> Register Provider
          </Button>
        }
      />

      {register.data?.status === "VALIDATED" && !registerOpen ? (
        <p
          role="status"
          className="border-l-2 border-emerald-500 bg-emerald-500/5 px-3 py-2 text-xs"
        >
          Provider registered and validated. It is now available to Instances.
        </p>
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Registered Provider</CardTitle>
          <CardDescription>
            Choose an Endpoint, managed credential, and model connection to
            inspect or revalidate. Only VALIDATED connections appear during
            Instance creation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {connections.data?.length ? (
            <>
              <div className="space-y-2">
                <Label>Provider connection</Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger className="min-h-12 h-auto py-2">
                    <SelectValue placeholder="Select a registered Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.data.map((connection) => (
                      <SelectItem key={connection.id} value={connection.id}>
                        {connection.name} · {connection.endpoint} · {connection.model} · credential stored · {connection.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selected ? (
                <ConnectionPanel
                  connection={selected}
                  pending={revalidate.isPending}
                  onRevalidate={() => revalidate.mutate(selected.id)}
                />
              ) : null}
            </>
          ) : (
            <EmptyState
              icon={Server}
              title="No Provider registered"
              description="Register an existing Endpoint, credential, and model, then validate the connection with Pi."
            />
          )}
        </CardContent>
      </Card>

      <ProviderRegistrationDrawer
        form={form}
        open={registerOpen}
        pending={register.isPending}
        result={register.data}
        error={register.error}
        onChange={setForm}
        onClose={closeRegistration}
        onSubmit={submit}
      />
    </div>
  );
}

function ProviderRegistrationDrawer({
  error,
  form,
  onChange,
  onClose,
  onSubmit,
  open,
  pending,
  result,
}: {
  error: Error | null;
  form: typeof initialForm;
  onChange: (value: typeof initialForm) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  open: boolean;
  pending: boolean;
  result: ProviderConnection | undefined;
}) {
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => nameRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open, pending]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close Provider registration"
        className="absolute inset-0 bg-foreground/20"
        onClick={onClose}
        disabled={pending}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="provider-registration-title"
        className="animate-in slide-in-from-right absolute inset-y-0 right-0 flex w-[min(94vw,38rem)] flex-col border-l bg-background shadow-[-18px_0_36px_-22px_rgba(15,23,42,0.45)] duration-200"
      >
        <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Provider registration
            </p>
            <h2
              id="provider-registration-title"
              className="mt-2 font-serif text-xl font-medium"
            >
              Register Provider
            </h2>
            <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
              Add an existing Endpoint and credential. Pi validates the complete
              connection before it becomes available to Instances.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Close Provider registration"
          >
            <X className="size-5" />
          </button>
        </header>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5">
            <ol className="grid border-y text-xs text-muted-foreground sm:grid-cols-3">
              {[
                ["01", "Connection", "Endpoint + credential"],
                ["02", "Validation", "Pi backend proof"],
                ["03", "Availability", "Instance selection"],
              ].map(([step, label, detail]) => (
                <li
                  key={step}
                  className="min-h-16 border-b p-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
                >
                  <span className="font-mono">{step}</span>
                  <strong className="ml-2 text-foreground">{label}</strong>
                  <span className="mt-1 block">{detail}</span>
                </li>
              ))}
            </ol>

            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="provider-name">Connection name</Label>
                <Input
                  ref={nameRef}
                  id="provider-name"
                  value={form.name}
                  onChange={(event) =>
                    onChange({ ...form, name: event.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider-endpoint">Endpoint</Label>
                <Input
                  id="provider-endpoint"
                  type="url"
                  value={form.endpoint}
                  onChange={(event) =>
                    onChange({ ...form, endpoint: event.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Model platform</Label>
                  <Select value="deepseek" disabled>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deepseek">DeepSeek · Pi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select
                    value={form.model}
                    onValueChange={(model) =>
                      onChange({ ...form, model: model as AgentModel })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deepseek-chat">
                        deepseek-chat
                      </SelectItem>
                      <SelectItem value="deepseek-reasoner">
                        deepseek-reasoner
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider-key">API key</Label>
                <Input
                  id="provider-key"
                  type="password"
                  autoComplete="off"
                  placeholder="Stored by the platform backend"
                  value={form.apiKey}
                  onChange={(event) =>
                    onChange({ ...form, apiKey: event.target.value })
                  }
                  required
                  minLength={8}
                />
                <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                  The credential is write-only and never returned by Provider
                  list or validation responses.
                </p>
              </div>
            </div>

            {error ? (
              <p role="alert" className="mt-5 text-sm text-destructive">
                {error.message}
              </p>
            ) : null}
            {result?.status === "FAILED" ? (
              <p
                role="status"
                className="mt-5 border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-xs"
              >
                {result.validationMessage}
              </p>
            ) : null}
          </div>

          <footer className="border-t bg-background px-5 py-4">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={onClose}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" className="h-11" disabled={pending}>
                {pending ? (
                  <RefreshCw className="animate-spin" />
                ) : (
                  <PlugZap />
                )}
                {pending ? "Validating connection…" : "Register & validate"}
              </Button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground sm:text-right">
              ESC closes this panel before validation starts.
            </p>
          </footer>
        </form>
      </section>
    </div>
  );
}

function ConnectionPanel({
  connection,
  pending,
  onRevalidate,
}: {
  connection: ProviderConnection;
  pending: boolean;
  onRevalidate: () => void;
}) {
  return (
    <div className="grid gap-5 border-t pt-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-medium">
              {connection.name}
            </h2>
            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
              {connection.endpoint}
            </p>
          </div>
          <StatusDot
            label={connection.status}
            tone={connection.status === "VALIDATED" ? "success" : "danger"}
          />
        </div>
        <dl className="mt-5 grid gap-3 text-xs sm:grid-cols-3">
          <div className="border-y py-3">
            <dt className="text-muted-foreground">Model platform</dt>
            <dd className="mt-1 font-medium">DeepSeek · Pi</dd>
          </div>
          <div className="border-y py-3">
            <dt className="text-muted-foreground">Model</dt>
            <dd className="mt-1 font-medium">{connection.model}</dd>
          </div>
          <div className="border-y py-3">
            <dt className="text-muted-foreground">Credential</dt>
            <dd className="mt-1 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              Stored by platform
            </dd>
          </div>
        </dl>
        <p className="mt-4 border-l-2 border-border px-3 text-xs leading-5 text-muted-foreground">
          {connection.validationMessage}
        </p>
      </div>
      <div className="border-l-0 lg:border-l lg:pl-5">
        <div className="space-y-1">
          {connection.checks.map((check) => (
            <div
              key={check.id}
              className="flex min-h-10 items-center justify-between gap-3 border-b text-xs last:border-b-0"
            >
              <span className="text-muted-foreground">{check.label}</span>
              <span
                className={cn(
                  "flex items-center gap-1 font-medium",
                  check.status === "FAIL" && "text-destructive",
                )}
              >
                {check.status === "PASS" ? (
                  <CheckCircle2 className="size-3.5" />
                ) : (
                  <CircleX className="size-3.5" />
                )}
                {check.status}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Pi latency</span>
          <span>
            {connection.validationLatencyMs === undefined
              ? "—"
              : `${connection.validationLatencyMs} ms`}
          </span>
        </div>
        <Button
          variant="outline"
          className="mt-4 h-11 w-full"
          onClick={onRevalidate}
          disabled={pending}
        >
          {pending ? (
            <RefreshCw className="animate-spin" />
          ) : (
            <KeyRound />
          )}
          {pending ? "Revalidating…" : "Revalidate connection"}
        </Button>
      </div>
    </div>
  );
}
