import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  ChevronDown,
  CircleHelp,
  FilePlus2,
  FileLock2,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Network,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ServerCog,
  Settings,
  ShieldEllipsis,
  Sparkles,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { BrandLogo } from "@/components/brand/brand-logo";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

type WorkspaceRoute =
  | "/providers"
  | "/dashboard"
  | "/instances"
  | "/requests/new"
  | "/sandboxes"
  | "/knowledge"
  | "/mcp"
  | "/policy"
  | "/skills"
  | "/tickets";

const navGroups: Array<{
  items: Array<[LucideIcon, string, WorkspaceRoute]>;
  label: string;
}> = [
  { label: "Overview", items: [[LayoutDashboard, "Workspace", "/dashboard"]] },
  { label: "Provider", items: [[Gauge, "Providers", "/providers"]] },
  {
    label: "Agent",
    items: [
      [Boxes, "Instances", "/instances"],
      [ShieldEllipsis, "Sandboxes", "/sandboxes"],
      [FileLock2, "Policy", "/policy"],
    ],
  },
  {
    label: "Extensions",
    items: [
      [Sparkles, "Skills", "/skills"],
      [ServerCog, "MCP Servers", "/mcp"],
      [Network, "Knowledge Base", "/knowledge"],
    ],
  },
  {
    label: "Approval",
    items: [
      [FilePlus2, "Raise Request", "/requests/new"],
      [ListChecks, "Ticket List", "/tickets"],
    ],
  },
];

const routeLabels: Record<string, string> = {
  agents: "Instances",
  providers: "Providers",
  dashboard: "Overview",
  instances: "Instances",
  knowledge: "Knowledge Base",
  mcp: "MCP Servers",
  policy: "Policy",
  new: "Create Instance",
  requests: "Requests",
  sandboxes: "Sandboxes",
  skills: "Skills",
  tickets: "Ticket List",
};

function NavGroup({ children, collapsed, label }: { children: ReactNode; collapsed: boolean; label: string }) {
  return (
    <div className="space-y-1">
      {collapsed ? <div className="mx-auto mb-2 h-px w-7 bg-sidebar-border" /> : (
        <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      )}
      {children}
    </div>
  );
}

function NavItem({ active, collapsed, icon: Icon, label, onNavigate, runtimeState, to }: {
  active: boolean;
  collapsed: boolean;
  icon: LucideIcon;
  label: string;
  onNavigate: () => void;
  runtimeState?: { label: string; tone: "danger" | "neutral" | "success" | "warning" };
  to: WorkspaceRoute;
}) {
  const link = (
    <Link
      to={to}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex min-h-11 items-center rounded-md border-l-2 border-transparent text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
        collapsed ? "justify-center px-2" : "gap-3 px-3",
        active
          ? "border-primary bg-sidebar-accent/55 font-semibold text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/65 hover:text-sidebar-foreground",
      )}
    >
      <span className="relative shrink-0">
        <Icon className={cn("size-[18px]", active && "text-primary")} />
        {runtimeState ? (
          <span
            aria-hidden="true"
            className={cn(
              "absolute -bottom-1 -right-1 size-2 rounded-full ring-2 ring-sidebar",
              runtimeState.tone === "success" && "bg-emerald-500",
              runtimeState.tone === "warning" && "bg-amber-500",
              runtimeState.tone === "danger" && "bg-destructive",
              runtimeState.tone === "neutral" && "bg-muted-foreground/50",
            )}
          />
        ) : null}
      </span>
      {collapsed ? null : <span>{label}</span>}
      {collapsed || !runtimeState ? null : (
        <span className="sr-only">OpenShell runtime: {runtimeState.label}</span>
      )}
    </Link>
  );
  return collapsed ? (
    <Tooltip><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="right">{label}</TooltipContent></Tooltip>
  ) : link;
}

function DisabledNav({ collapsed, icon: Icon, label }: { collapsed: boolean; icon: LucideIcon; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          disabled
          className={cn(
            "flex min-h-11 w-full cursor-not-allowed items-center rounded-md text-left text-sm text-muted-foreground/45",
            collapsed ? "justify-center px-2" : "gap-3 px-3",
          )}
        >
          <Icon className="size-[18px] shrink-0" />
          {collapsed ? null : <><span>{label}</span><span className="ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide">Later</span></>}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">Not part of the current agent operating path.</TooltipContent>
    </Tooltip>
  );
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const parts = pathname.split("/").filter(Boolean);
  const labels = parts.map((part, index) => {
    if (index === 1 && parts[0] === "agents" && part !== "new") return "Agent detail";
    if (index === 1 && parts[0] === "requests" && part === "new") return "Raise Request";
    return routeLabels[part] ?? part;
  });
  return (
    <nav aria-label="Breadcrumb" className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
      <Link to="/dashboard" className="hover:text-foreground">Workspace</Link>
      {labels.filter((label) => label !== "Overview").map((label) => (
        <span key={label} className="flex items-center gap-2"><span aria-hidden="true">/</span><span className="font-medium text-foreground">{label}</span></span>
      ))}
    </nav>
  );
}

export function AppShell() {
  const { logout, user } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const runtime = useQuery({
    queryKey: ["runtime-status"],
    queryFn: api.getRuntimeStatus,
    retry: 1,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
  const openShellRuntime = runtime.isPending
    ? { label: "Checking", tone: "neutral" as const }
    : runtime.data?.terminal.available &&
        runtime.data.terminal.transport === "openshell"
      ? { label: "Connected", tone: "success" as const }
      : runtime.error
        ? { label: "Unavailable", tone: "danger" as const }
        : { label: "Unavailable", tone: "warning" as const };
  const isActive = (to: WorkspaceRoute) => {
    if (to === "/instances") return pathname === "/instances" || pathname.startsWith("/agents");
    return pathname === to;
  };
  const initials = useMemo(
    () => (user?.displayName || user?.username || "User").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    [user],
  );

  useEffect(() => {
    const stored = window.localStorage.getItem("tasklattice.sidebar.collapsed");
    setCollapsed(stored === "true");
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileOpen(false);
      setAccountOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      window.localStorage.setItem("tasklattice.sidebar.collapsed", String(!value));
      return !value;
    });
  };

  const sidebarContent = (isCollapsed: boolean) => (
    <>
      <div className={cn("flex h-16 shrink-0 items-center border-b border-sidebar-border", isCollapsed ? "justify-center px-2" : "gap-3 px-4")}>
        <Link to="/dashboard" className="flex min-h-11 min-w-0 items-center gap-3 rounded-sm focus-visible:outline-2" aria-label="TaskLattice workspace">
          <BrandLogo compact={isCollapsed} />
        </Link>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto overflow-x-hidden p-3" aria-label="Workspace navigation">
        {navGroups.map((group) => (
          <NavGroup key={group.label} label={group.label} collapsed={isCollapsed}>
            {group.items.map(([Icon, label, to]) => (
              <div key={to}>
                <NavItem
                  active={isActive(to)}
                  collapsed={isCollapsed}
                  icon={Icon}
                  label={label}
                  onNavigate={() => setMobileOpen(false)}
                  {...(to === "/sandboxes" ? { runtimeState: openShellRuntime } : {})}
                  to={to}
                />
                {to === "/sandboxes" && !isCollapsed ? (
                  <Link
                    to="/sandboxes"
                    onClick={() => setMobileOpen(false)}
                    className="mx-3 mb-2 mt-1 block border-l border-sidebar-border py-1.5 pl-3 text-[11px] leading-4 text-muted-foreground transition-colors hover:border-foreground/50 hover:text-sidebar-foreground focus-visible:outline-2"
                    aria-label={`OpenShell runtime ${openShellRuntime.label}. Open Sandboxes.`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sidebar-foreground">OpenShell runtime</span>
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            openShellRuntime.tone === "success" && "bg-emerald-500",
                            openShellRuntime.tone === "warning" && "bg-amber-500",
                            openShellRuntime.tone === "danger" && "bg-destructive",
                            openShellRuntime.tone === "neutral" && "bg-muted-foreground/50",
                          )}
                        />
                        {openShellRuntime.label}
                      </span>
                    </span>
                    <span className="mt-0.5 block">Sandbox execution layer</span>
                  </Link>
                ) : null}
              </div>
            ))}
          </NavGroup>
        ))}
      </nav>
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <DisabledNav collapsed={isCollapsed} icon={Settings} label="Platform settings" />
        <DisabledNav collapsed={isCollapsed} icon={CircleHelp} label="Help & documentation" />
        <div className="relative mt-2 border-t border-sidebar-border pt-3">
          <button
            type="button"
            aria-expanded={accountOpen}
            onClick={() => setAccountOpen((value) => !value)}
            className={cn("flex min-h-12 w-full items-center rounded-md hover:bg-sidebar-accent focus-visible:outline-2", isCollapsed ? "justify-center" : "gap-3 px-2")}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{initials}</span>
            {isCollapsed ? null : <><span className="min-w-0 flex-1 text-left"><strong className="block truncate text-xs">{user?.displayName}</strong><span className="block truncate text-[10px] text-muted-foreground">{user?.provider === "sso" ? "SSO account" : "Local account"}</span></span><ChevronDown className={cn("size-4 text-muted-foreground transition-transform", accountOpen && "rotate-180")} /></>}
          </button>
          {accountOpen ? (
            <div className={cn("absolute bottom-[calc(100%+0.5rem)] z-50 rounded-md border bg-popover p-2 text-popover-foreground shadow-md", isCollapsed ? "left-0 w-56" : "inset-x-0")}>
              <div className="px-2 py-2"><p className="text-xs font-semibold">{user?.displayName}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{user?.email || user?.username}</p></div>
              <button type="button" onClick={() => void logout()} className="flex min-h-11 w-full items-center gap-2 rounded-sm px-2 text-sm text-destructive hover:bg-destructive/10 focus-visible:outline-2"><LogOut className="size-4" />Sign out</button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );

  return (
    <TooltipProvider delayDuration={250}>
      <div className="min-h-svh bg-background text-foreground">
        <aside className={cn("fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex lg:flex-col", collapsed ? "w-[4.5rem]" : "w-[17.5rem]")}>
          {sidebarContent(collapsed)}
        </aside>

        {mobileOpen ? <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px] lg:hidden" onClick={() => setMobileOpen(false)} /> : null}
        <aside aria-hidden={!mobileOpen} className={cn("fixed inset-y-0 left-0 z-50 flex w-[min(88vw,20rem)] flex-col border-r bg-sidebar shadow-2xl transition-transform duration-200 lg:hidden", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
          <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="absolute right-3 top-2.5 z-10 grid size-11 place-items-center rounded-lg hover:bg-sidebar-accent focus-visible:outline-2"><X className="size-5" /></button>
          {sidebarContent(false)}
        </aside>

        <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[4.5rem]" : "lg:pl-[17.5rem]")}>
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/94 px-4 backdrop-blur-md sm:px-6 lg:px-8">
            <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" aria-expanded={mobileOpen} className="grid size-11 place-items-center rounded-xl hover:bg-muted focus-visible:outline-2 lg:hidden"><Menu className="size-5" /></button>
            <button type="button" onClick={toggleCollapsed} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} aria-expanded={!collapsed} className="hidden size-11 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 lg:grid">
              {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
            </button>
            <Breadcrumbs pathname={pathname} />
            <button disabled className="ml-auto hidden min-h-10 w-64 cursor-not-allowed items-center gap-2 rounded-xl border bg-muted/30 px-3 text-sm text-muted-foreground/45 md:flex"><Search className="size-4" />Search workspace<span className="ml-auto text-[10px] uppercase">Later</span></button>
            <div className="ml-auto flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs font-semibold md:ml-2"><span className="size-2 rounded-full bg-[#79a93b]" />UAT</div>
            <div className="grid size-9 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground" aria-label={`Signed in as ${user?.displayName}`}><UserRound className="size-4" /></div>
          </header>
          <main id="main-content" className="mx-auto w-full max-w-[1440px] p-5 sm:p-6 lg:p-8"><Outlet /></main>
        </div>
      </div>
    </TooltipProvider>
  );
}
