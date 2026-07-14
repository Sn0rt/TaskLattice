import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Boxes,
  Check,
  Command,
  Cpu,
  Network,
  ShieldCheck,
  SquareTerminal,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

export const Route = createFileRoute("/")({ component: LandingPage });

const workflow = [
  { label: "Declare", detail: "Describe the agent and model boundary." },
  { label: "Provision", detail: "Create an isolated NemoClaw sandbox." },
  { label: "Operate", detail: "Inspect state and enter the live terminal." },
];

const systemFeatures: Array<[LucideIcon, string, string]> = [
  [Boxes, "Isolation", "One agent, one inspectable sandbox boundary."],
  [Network, "Orchestration", "A deliberate path from declaration to runtime."],
  [Cpu, "Operations", "Live status and terminal access at the point of work."],
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      {compact ? null : (
        <span className="text-sm font-semibold tracking-[-0.02em]">
          TaskLattice
        </span>
      )}
    </div>
  );
}

function LandingPage() {
  const { user } = useAuth();
  return (
    <div className="landing-page min-h-svh overflow-hidden bg-[#f4f3ee] text-[#171915]">
      <header className="relative z-20 mx-auto flex h-20 max-w-[1480px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link to="/" aria-label="TaskLattice home">
          <BrandMark />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-[#5d6158] md:flex" aria-label="Landing navigation">
          <a href="#system" className="hover:text-[#171915]">System</a>
          <a href="#workflow" className="hover:text-[#171915]">Workflow</a>
          <a href="#trust" className="hover:text-[#171915]">Trust</a>
        </nav>
        <Link
          to={user ? "/dashboard" : "/login"}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#171915] px-5 text-sm font-medium transition-colors hover:bg-[#171915] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {user ? "Open workspace" : "Sign in"}
          <ArrowRight className="size-4" />
        </Link>
      </header>

      <main>
        <section className="landing-grid relative mx-auto grid min-h-[calc(100svh-5rem)] max-w-[1480px] items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-12 lg:py-20">
          <div className="relative z-10 max-w-3xl">
            <p className="mb-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#5d6158]">
              <span className="h-px w-8 bg-[#93c83e]" />
              Agent operations, made legible
            </p>
            <h1 className="max-w-4xl text-balance text-[clamp(3.7rem,7.4vw,8rem)] font-semibold leading-[0.88] tracking-[-0.075em]">
              Give agents
              <span className="block text-[#557d16]">real ground.</span>
            </h1>
            <p className="mt-9 max-w-xl text-pretty text-lg leading-8 text-[#51554c] sm:text-xl">
              TaskLattice is the control plane for creating, isolating, and
              operating AI agents on Kubernetes—without hiding the runtime
              state that matters.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to={user ? "/dashboard" : "/login"}
                className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#171915] px-6 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {user ? "Enter the workspace" : "Start operating"}
                <ArrowRight className="size-4 text-[#b9ef63]" />
              </Link>
              <a
                href="#workflow"
                className="inline-flex min-h-12 items-center px-2 text-sm font-medium underline decoration-[#aeb2a8] underline-offset-8 hover:decoration-[#171915]"
              >
                See the operating loop
              </a>
            </div>
          </div>

          <div className="relative z-10 lg:justify-self-end">
            <div className="operator-window" aria-label="TaskLattice agent operation preview">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-2 text-xs text-white/55">
                  <Command className="size-3.5" />
                  OPERATIONS / AGENT-07
                </div>
                <span className="flex items-center gap-2 text-[11px] font-medium text-[#c8f18d]">
                  <span className="size-1.5 rounded-full bg-[#a9e85a]" />
                  READY
                </span>
              </div>
              <div className="grid gap-8 p-6 sm:p-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/35">Desired agent</p>
                  <div className="mt-3 flex items-center gap-3">
                    <Bot className="size-5 text-[#b9ef63]" />
                    <span className="text-lg font-medium text-white">research-operator</span>
                  </div>
                  <p className="mt-2 font-mono text-xs text-white/42">deepseek-chat · nemoclaw</p>
                </div>
                <div className="lattice-path" aria-hidden="true">
                  <span className="is-complete"><Check /></span>
                  <i />
                  <span className="is-complete"><Check /></span>
                  <i />
                  <span><SquareTerminal /></span>
                </div>
                <div className="grid grid-cols-[1fr_auto] items-end gap-5 border-t border-white/10 pt-6">
                  <div>
                    <p className="text-xs text-white/38">Runtime sandbox</p>
                    <p className="mt-2 font-mono text-sm text-white/80">nemo-agent-07-a1f9</p>
                  </div>
                  <span className="rounded-full bg-[#b9ef63] px-4 py-2 text-xs font-semibold text-[#171915]">Open terminal</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-between px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#777b72]">
              <span>Control plane / 01</span>
              <span>Evidence over abstraction</span>
            </div>
          </div>
        </section>

        <section id="system" className="border-y border-[#d6d6ce] bg-[#171915] text-white">
          <div className="mx-auto grid max-w-[1480px] lg:grid-cols-[0.8fr_1.2fr]">
            <div className="border-b border-white/10 p-8 sm:p-12 lg:border-b-0 lg:border-r lg:p-16">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b9ef63]">The system</p>
              <h2 className="mt-8 max-w-md text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
                The runtime remains visible.
              </h2>
              <p className="mt-6 max-w-md leading-7 text-white/58">
                Desired configuration and actual sandbox state stay separate,
                so operators can see what was requested, what exists, and
                where a failure happened.
              </p>
            </div>
            <div className="grid sm:grid-cols-3">
              {systemFeatures.map(([Icon, title, copy], index) => (
                <article key={String(title)} className="border-b border-white/10 p-8 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:p-10">
                  <div className="flex items-center justify-between">
                    <Icon className="size-5 text-[#b9ef63]" />
                    <span className="font-mono text-[10px] text-white/28">0{index + 1}</span>
                  </div>
                  <h3 className="mt-16 text-lg font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/50">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="mx-auto max-w-[1480px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#557d16]">Operating loop</p>
              <h2 className="mt-6 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Three moves.<br />No hidden leap.</h2>
            </div>
            <ol className="border-t border-[#c8c9c0]">
              {workflow.map((item, index) => (
                <li key={item.label} className="grid gap-4 border-b border-[#c8c9c0] py-7 sm:grid-cols-[4rem_0.65fr_1fr] sm:items-center">
                  <span className="font-mono text-xs text-[#777b72]">0{index + 1}</span>
                  <strong className="text-xl font-medium">{item.label}</strong>
                  <span className="text-sm leading-6 text-[#61655c]">{item.detail}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="trust" className="mx-3 mb-3 rounded-[2rem] bg-[#dfe9cd] px-5 py-20 sm:mx-5 sm:px-8 lg:px-12 lg:py-24">
          <div className="mx-auto flex max-w-[1380px] flex-col justify-between gap-12 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <ShieldCheck className="size-7 text-[#557d16]" />
              <h2 className="mt-8 text-4xl font-semibold leading-tight tracking-[-0.045em] sm:text-6xl">Control starts with a boundary you can explain.</h2>
            </div>
            <div className="max-w-md">
              <p className="text-base leading-7 text-[#4e5844]">Local identity and OIDC SSO lead into the same authenticated workspace. Agent APIs remain behind that boundary, while runtime session tokens stay short-lived and task-specific.</p>
              <Link to={user ? "/dashboard" : "/login"} className="mt-8 inline-flex min-h-11 items-center gap-2 border-b border-[#171915] text-sm font-semibold">
                {user ? "Open your workspace" : "Authenticate to continue"}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-5 px-5 py-10 text-xs text-[#6a6e65] sm:px-8 lg:px-12">
        <BrandMark />
        <span>Isolated agents. Observable operations.</span>
        <span>© {new Date().getFullYear()} TaskLattice</span>
      </footer>
    </div>
  );
}
