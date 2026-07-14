import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

export const Route = createFileRoute("/auth/sso-complete")({
  component: SsoComplete,
});

function SsoComplete() {
  const { loginWithToken } = useAuth();
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("token");
    const redirect = params.get("redirect") ?? "/dashboard";
    if (!token) {
      window.location.replace("/login?error=SSO%20did%20not%20return%20a%20session.");
      return;
    }
    window.history.replaceState(null, "", "/auth/sso-complete");
    void loginWithToken(token, false, redirect).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "SSO session validation failed.";
      window.location.replace(`/login?error=${encodeURIComponent(message)}`);
    });
  }, [loginWithToken]);

  return (
    <main className="grid min-h-svh place-items-center bg-[#f4f3ee] p-6 text-[#171915]">
      <div className="text-center"><LoaderCircle className="mx-auto size-6 animate-spin text-[#557d16]" /><p className="mt-4 text-sm text-[#5d6158]">Completing secure sign in…</p></div>
    </main>
  );
}
