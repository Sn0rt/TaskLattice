import { useEffect, useRef, useState } from "react";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal as Xterm } from "@xterm/xterm";
import { encodeTerminalResize } from "@tasklattice/contracts";
import "@xterm/xterm/css/xterm.css";
import { SquareTerminal } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  acquireTerminalSession,
  releaseTerminalSession,
  resetTerminalSession,
  type TerminalSession,
  type TerminalSessionEvent,
} from "@/lib/terminal-session";

export type TerminalConnectionState =
  | "idle"
  | "connecting"
  | "starting"
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
  const [attempt, setAttempt] = useState(0);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState<string>();
  const [terminalKind, setTerminalKind] =
    useState<"fixture" | "nemoclaw" | null>(null);

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
      "\x1b[2mDetecting the Sandbox runtime before opening its terminal…\x1b[0m",
    );
    setConnectionState("connecting");

    let disposed = false;
    let session: TerminalSession | undefined;
    let sessionListener: ((event: TerminalSessionEvent) => void) | undefined;
    let runtimeTimer: number | undefined;
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
    const clearTimers = () => {
      window.clearTimeout(connectionTimer);
      if (runtimeTimer) window.clearTimeout(runtimeTimer);
    };
    const markReady = () => {
      clearTimers();
      setConnectionState("ready");
    };

    const markRuntimeConnected = () => {
      window.clearTimeout(connectionTimer);
      setConnectionState("starting");
      if (runtimeTimer) return;
      runtimeTimer = window.setTimeout(() => {
        if (disposed || session?.interactive) return;
        const message =
          "OpenShell connected, but OpenClaw TUI did not produce a frame. Retry the terminal or inspect Sandbox activity.";
        setError(message);
        setConnectionState("error");
        terminal.writeln(`\r\n\x1b[31m${message}\x1b[0m`);
        if (
          session?.socket.readyState === WebSocket.OPEN ||
          session?.socket.readyState === WebSocket.CONNECTING
        )
          session.socket.close(4000, "OpenClaw TUI frame timed out");
      }, 20_000);
    };

    const sendResize = () => {
      fit.fit();
      if (session?.socket.readyState === WebSocket.OPEN)
        session.socket.send(
          encodeTerminalResize({ cols: terminal.cols, rows: terminal.rows }),
        );
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
            sendResize();
            terminal.focus();
            return;
          }
          if (event.type === "message") {
            if (event.data.startsWith("Connected to fixture shell ")) {
              setTerminalKind("fixture");
              markReady();
            } else if (event.data.startsWith("Connected to NemoClaw runtime ")) {
              setTerminalKind("nemoclaw");
              markRuntimeConnected();
            } else if (session?.interactive) {
              markReady();
            }
            terminal.write(event.data);
            terminal.focus();
            return;
          }
          if (event.type === "close") {
            clearTimers();
            setConnectionState("closed");
            const suffix = event.event.reason ? `: ${event.event.reason}` : "";
            terminal.writeln(
              `\r\n\x1b[2mTerminal session closed${suffix}.\x1b[0m`,
            );
            return;
          }
          if (event.type === "error") {
            clearTimers();
            setError("Unable to connect to the Sandbox terminal.");
            setConnectionState("error");
          }
        };
        session.listeners.add(sessionListener);
        if (session.buffer.length > 0) terminal.write(session.buffer.join(""));
        if (session.connected) {
          setTerminalKind(session.connectionKind);
          if (session.connectionKind === "fixture" || session.interactive)
            markReady();
          else markRuntimeConnected();
          sendResize();
          terminal.focus();
        }
      })
      .catch((reason: unknown) => {
        clearTimers();
        const message =
          reason instanceof Error ? reason.message : "Terminal unavailable.";
        setError(message);
        setConnectionState("error");
        terminal.writeln(`\r\n\x1b[31m${message}\x1b[0m`);
      });

    return () => {
      disposed = true;
      clearTimers();
      resizeObserver.disconnect();
      container.current?.removeEventListener("pointerdown", focusTerminal);
      if (session && sessionListener) session.listeners.delete(sessionListener);
      releaseTerminalSession(sessionKey);
      inputSubscription.dispose();
      terminal.dispose();
    };
  }, [agentId, attempt, requested]);

  const retry = () => {
    resetTerminalSession(`agent/${agentId}`);
    setError(undefined);
    setTerminalKind(null);
    setConnectionState("connecting");
    setAttempt((value) => value + 1);
  };

  if (!requested) {
    return (
      <Button className="h-11" disabled={!enabled} onClick={() => setRequested(true)}>
        <SquareTerminal />
        Open terminal
      </Button>
    );
  }

  const ready = connectionState === "ready";
  const status = ready
    ? terminalKind === "fixture"
      ? "Fixture shell ready — OpenClaw TUI requires the OpenShell runtime"
      : "OpenClaw TUI ready — connected through the NemoClaw Gateway"
    : connectionState === "starting"
      ? "OpenShell connected — waiting for the first OpenClaw TUI frame…"
      : connectionState === "closed"
        ? "Terminal session closed"
        : (error ?? "Connecting to OpenShell Sandbox…");

  return (
    <div>
      <div className="mb-2 flex min-h-11 flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
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
        </span>
        {connectionState === "error" || connectionState === "closed" ? (
          <Button className="h-11" size="sm" variant="outline" onClick={retry}>
            Retry terminal
          </Button>
        ) : null}
      </div>
      <div
        ref={container}
        aria-label="Interactive Kubernetes Sandbox terminal"
        className="h-[360px] cursor-text overflow-hidden rounded-sm border bg-[#0b0f0e] p-2"
      />
    </div>
  );
}
