import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, Link2, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PreviewBadge } from "@/components/shared/preview-badge";
import { StatusDot } from "@/components/shared/status-dot";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { skillPreviews } from "@/lib/preview-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/skills")({ component: Skills });

function Skills() {
  const defaultSkill = skillPreviews[0]!;
  const [selectedId, setSelectedId] = useState(defaultSkill.id);
  const selected =
    skillPreviews.find((skill) => skill.id === selectedId) ?? defaultSkill;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Skill"
        title="Skills"
        badge={<PreviewBadge />}
        description="Manage Skill packages from one list and bind actions to the selected item."
        actions={
          <Button className="h-11">
            <Plus /> Create Skill
          </Button>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Skill list</CardTitle>
            <CardDescription>
              Published and draft packages visible to this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="hidden grid-cols-[minmax(0,1.4fr)_0.7fr_0.8fr_auto] gap-3 border-b px-4 py-2 text-xs text-muted-foreground sm:grid">
              <span>Skill</span>
              <span>Version</span>
              <span>Bindings</span>
              <span>Status</span>
            </div>
            {skillPreviews.map((skill) => (
              <button
                key={skill.id}
                type="button"
                aria-pressed={selected.id === skill.id}
                onClick={() => setSelectedId(skill.id)}
                className={cn(
                  "grid min-h-16 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-muted/45 focus-visible:outline-2 focus-visible:outline-offset-[-2px] sm:grid-cols-[minmax(0,1.4fr)_0.7fr_0.8fr_auto]",
                  selected.id === skill.id &&
                    "bg-muted/70 shadow-[inset_3px_0_0_var(--foreground)]",
                )}
              >
                <span className="min-w-0">
                  <strong className="block truncate font-medium">
                    {skill.name}
                  </strong>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {skill.owner}
                  </span>
                </span>
                <span className="hidden font-mono text-xs sm:block">
                  v{skill.version}
                </span>
                <span className="hidden text-xs sm:block">
                  {skill.bindings} instances
                </span>
                <StatusDot
                  label={skill.status}
                  tone={skill.status === "PUBLISHED" ? "success" : "neutral"}
                />
              </button>
            ))}
          </CardContent>
        </Card>
        <Card className="xl:sticky xl:top-24">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-3">
              <StatusDot
                label={selected.status}
                tone={selected.status === "PUBLISHED" ? "success" : "neutral"}
              />
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
                ["Package", selected.status === "PUBLISHED" ? "Verified" : "Pending"],
                ["Version", `v${selected.version}`],
                ["Instances", `${selected.bindings} bound`],
                ["Permissions", `${selected.permissions} scopes`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex min-h-10 items-center justify-between gap-3 border-b"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs leading-5 text-muted-foreground">
              Skill CRUD and binding are shown for layout review; their APIs are
              not part of the current runtime slice.
            </p>
            <div className="grid gap-2">
              <Button variant="outline" className="h-11" disabled>
                <Pencil /> Update selected
              </Button>
              <Button variant="outline" className="h-11" disabled>
                <Link2 /> Bind to Instance
              </Button>
              <Button variant="destructive" className="h-11" disabled>
                <Trash2 /> Delete selected
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
