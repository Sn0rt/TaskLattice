import { useEffect, useRef, useState } from "react";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal as Xterm } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { SquareTerminal } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  acquireTerminalSession,
  releaseTerminalSession,
  type TerminalSession,
  type TerminalSessionEvent,
} from "@/lib/terminal-session";

export type TerminalConnectionState =
  | "idle"
  | "connecting"
  | "ready"
  | "closed"
  | "error";

export function AgentTerminal({
  agentId,
  enabled,
}: {
  agentId: string;
  enabled: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [connectionState, setConnectionState] =
    useState<TerminalConnectionState>("idle");
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!requested || !container.current) return;

    const terminal = new Xterm({
      convertEol: true,
      cursorBlink: true,
      cursorStyle: "block",
      fontSize: 13,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      scrollback: 2_000,
      theme: {
        background: "#0b0f0e",
        foreground: "#d8e0db",
        cursor: "#b9f45a",
        selectionBackground: "#36531499",
      },
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(container.current);
    terminal.writeln(
      "\x1b[2mRequesting an OpenShell terminal for this Kubernetes Sandbox…\x1b[0m",
    );
    terminal.writeln(
      "\x1b[2mStarting the DeepSeek-backed OpenClaw TUI automatically…\x1b[0m",
    );
    setConnectionState("connecting");

    let disposed = false;
    let session: TerminalSession | undefined;
    let sessionListener: ((event: TerminalSessionEvent) => void) | undefined;
    const sessionKey = `agent/${agentId}`;
    const connectionTimer = window.setTimeout(() => {
      if (disposed || session?.connected) return;
      const message =
        "OpenShell terminal connection timed out. Close this panel and try again.";
      setError(message);
      setConnectionState("error");
      terminal.writeln(`\r\n\x1b[31m${message}\x1b[0m`);
      if (
        session?.socket.readyState === WebSocket.OPEN ||
        session?.socket.readyState === WebSocket.CONNECTING
      )
        session.socket.close(4000, "terminal connection timed out");
    }, 15_000);
    const markReady = () => {
      window.clearTimeout(connectionTimer);
      setConnectionState("ready");
    };

    const sendResize = () => {
      fit.fit();
    };

    const resizeObserver = new ResizeObserver(() => sendResize());
    resizeObserver.observe(container.current);
    requestAnimationFrame(() => sendResize());

    const inputSubscription = terminal.onData((data) => {
      if (session?.socket.readyState === WebSocket.OPEN)
        session.socket.send(data);
    });

    const focusTerminal = () => terminal.focus();
    container.current.addEventListener("pointerdown", focusTerminal);

    void acquireTerminalSession(sessionKey, async () => {
      const created = await api.createTerminalSession(agentId);
      const protocol = location.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${location.host}${created.websocketUrl}`;
    })
      .then((acquired) => {
        session = acquired;
        if (disposed) {
          releaseTerminalSession(sessionKey);
          return;
        }
        sessionListener = (event) => {
          if (disposed) return;
          if (event.type === "open") {
            terminal.writeln(
              "\x1b[2mWebSocket connected; opening OpenShell exec…\x1b[0m",
            );
            terminal.focus();
            return;
          }
          if (event.type === "message") {
            if (event.data.startsWith("Connected to ")) markReady();
            terminal.write(event.data);
            terminal.focus();
            return;
          }
          if (event.type === "close") {
            window.clearTimeout(connectionTimer);
            setConnectionState("closed");
            const suffix = event.event.reason ? `: ${event.event.reason}` : "";
            terminal.writeln(
              `\r\n\x1b[2mTerminal session closed${suffix}.\x1b[0m`,
            );
            return;
          }
          if (event.type === "error") {
            window.clearTimeout(connectionTimer);
            setError("Unable to connect to the Sandbox terminal.");
            setConnectionState("error");
          }
        };
        session.listeners.add(sessionListener);
        if (session.buffer.length > 0) terminal.write(session.buffer.join(""));
        if (session.connected) {
          markReady();
          terminal.focus();
        }
      })
      .catch((reason: unknown) => {
        window.clearTimeout(connectionTimer);
        const message =
          reason instanceof Error ? reason.message : "Terminal unavailable.";
        setError(message);
        setConnectionState("error");
        terminal.writeln(`\r\n\x1b[31m${message}\x1b[0m`);
      });

    return () => {
      disposed = true;
      window.clearTimeout(connectionTimer);
      resizeObserver.disconnect();
      container.current?.removeEventListener("pointerdown", focusTerminal);
      if (session && sessionListener) session.listeners.delete(sessionListener);
      releaseTerminalSession(sessionKey);
      inputSubscription.dispose();
      terminal.dispose();
    };
  }, [agentId, requested]);

  if (!requested) {
    return (
      <Button disabled={!enabled} onClick={() => setRequested(true)}>
        <SquareTerminal />
        Open terminal
      </Button>
    );
  }

  const ready = connectionState === "ready";
  const status = ready
    ? "NemoClaw ready — OpenClaw TUI is starting with DeepSeek"
    : connectionState === "closed"
      ? "Terminal session closed"
      : (error ?? "Connecting to OpenShell Sandbox…");

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className={`size-2 rounded-full ${
            ready
              ? "bg-emerald-500"
              : connectionState === "error" || connectionState === "closed"
                ? "bg-red-500"
                : "animate-pulse bg-amber-500"
          }`}
        />
        {status}
      </div>
      <div
        ref={container}
        aria-label="Interactive Kubernetes Sandbox terminal"
        className="h-[360px] cursor-text overflow-hidden rounded-lg border bg-[#0b0f0e] p-2"
      />
    </div>
  );
}
