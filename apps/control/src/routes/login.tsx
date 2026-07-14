import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, EyeOff, KeyRound, LoaderCircle, LockKeyhole, UserRound } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/components/auth/auth-provider";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: z.object({
    error: z.string().optional(),
    redirect: z.string().optional(),
  }),
});

function LoginPage() {
  const search = Route.useSearch();
  const { config, error: configError, loading, loginWithToken } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(search.error ?? "");
  const redirect =
    search.redirect?.startsWith("/") && !search.redirect.startsWith("//")
      ? search.redirect
      : "/dashboard";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/v1/auth/local", {
        body: JSON.stringify({ password, remember, username }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as { message?: string; token?: string };
      if (!response.ok || !payload.token) throw new Error(payload.message ?? "Sign in failed.");
      await loginWithToken(payload.token, remember, redirect);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-svh bg-[#f4f3ee] text-[#171915] lg:grid-cols-[0.9fr_1.1fr]">
      <section className="login-visual relative hidden overflow-hidden border-r border-[#d6d6ce] p-12 lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="relative z-10 flex items-center gap-3 text-sm font-semibold">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          TaskLattice
        </Link>
        <div className="relative z-10 max-w-xl pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#557d16]">Authenticated operations</p>
          <h1 className="mt-7 text-6xl font-semibold leading-[0.94] tracking-[-0.06em]">A clear boundary<br />before the work.</h1>
          <p className="mt-7 max-w-md text-base leading-7 text-[#5d6158]">Local operators and your OIDC identity provider enter the same inspectable workspace.</p>
        </div>
        <div className="relative z-10 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#777b72]"><LockKeyhole className="size-4" />Session-protected control plane</div>
      </section>

      <section className="flex min-h-svh items-center justify-center px-5 py-12 sm:px-8 lg:px-16">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-14 flex items-center gap-3 text-sm font-semibold lg:hidden">
            <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
            TaskLattice
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#557d16]">Workspace access</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em]">Welcome back</h2>
          <p className="mt-3 text-sm leading-6 text-[#666a61]">Sign in to create and operate isolated agents.</p>

          {error || configError ? (
            <div role="alert" className="mt-7 border-l-2 border-[#bb3e2c] bg-[#f7e6e1] px-4 py-3 text-sm text-[#7d2d21]">
              <strong className="block font-semibold">Sign in failed</strong>
              <span className="mt-1 block">{error || configError}</span>
            </div>
          ) : null}
          {config?.developmentDefaults ? (
            <div className="mt-7 border-l-2 border-[#829f4e] bg-[#e8eddc] px-4 py-3 text-sm text-[#4b5838]">
              Local development defaults are active: <strong>admin / admin</strong>. Configure credentials before deployment.
            </div>
          ) : null}

          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block text-sm font-medium">
              Username
              <span className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-[#c8c9c0] bg-white px-4 focus-within:border-[#557d16] focus-within:ring-2 focus-within:ring-[#557d16]/15">
                <UserRound className="size-4 text-[#777b72]" />
                <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Enter your username" required />
              </span>
            </label>
            <label className="block text-sm font-medium">
              Password
              <span className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-[#c8c9c0] bg-white px-4 focus-within:border-[#557d16] focus-within:ring-2 focus-within:ring-[#557d16]/15">
                <KeyRound className="size-4 text-[#777b72]" />
                <input value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Enter your password" required type={showPassword ? "text" : "password"} />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="grid size-11 place-items-center rounded-lg text-[#686c63] hover:bg-[#efefe9] focus-visible:outline-2" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
            </label>
            <label className="flex min-h-11 items-center gap-3 text-sm text-[#5d6158]">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="size-4 accent-[#557d16]" />
              Keep me signed in on this device
            </label>
            <button disabled={submitting || loading} type="submit" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#171915] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#31342e] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {config?.ssoEnabled ? (
            <div className="mt-8">
              <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.16em] text-[#888c83]"><span className="h-px flex-1 bg-[#d6d6ce]" />or<span className="h-px flex-1 bg-[#d6d6ce]" /></div>
              <button type="button" onClick={() => window.location.assign(`/api/v1/auth/sso/start?redirect=${encodeURIComponent(redirect)}`)} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[#aeb0a7] bg-white px-6 text-sm font-semibold hover:border-[#171915] focus-visible:outline-2 focus-visible:outline-offset-2">
                <LockKeyhole className="size-4" />Continue with {config.providerName}
              </button>
            </div>
          ) : null}
          <p className="mt-10 text-center text-xs leading-5 text-[#7b7f76]">Access is limited to configured operators. Authentication events may be audited.</p>
        </div>
      </section>
    </main>
  );
}
