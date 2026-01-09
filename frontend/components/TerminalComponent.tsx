"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { io, Socket } from "socket.io-client";

import { getApiBaseUrl } from "@/lib/api/httpClient";
import { cancelRun } from "@/lib/api/runs";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

/* ---------------- TYPES ---------------- */

type RunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "timed_out";

type RunStreamEvent =
  | { type: "stdout"; data: string }
  | { type: "stderr"; data: string }
  | { type: "status"; data: RunStatus; reason?: string };

type TerminalComponentProps = {
  runId: string;
  token?: string;
};

/* ---------------- CONSTANTS ---------------- */

const TERMINAL_CLEAR_EVENT = "nebula-terminal-clear";

const resolveTerminalSocketUrl = () => {
  const explicit = process.env.NEXT_PUBLIC_TERMINAL_SOCKET_URL;
  const fallback = process.env.NEXT_PUBLIC_SOCKET_URL;
  return (explicit ?? fallback ?? getApiBaseUrl()).replace(/\/$/, "");
};

const resolveWsAuthToken = (token?: string) => {
  if (token) return token;
  const fromEnv = process.env.NEXT_PUBLIC_WS_AUTH_TOKEN;
  if (fromEnv) return fromEnv;

  // Backend WsAuthGuard defaults to 'devtoken' if WS_AUTH_TOKEN is not set.
  // Keep a dev fallback so the demo works out-of-the-box.
  if (process.env.NODE_ENV !== "production") return "devtoken";
  return undefined;
};

/* ---------------- COMPONENT ---------------- */

const TerminalComponent = ({ runId, token }: TerminalComponentProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [status, setStatus] = useState<RunStatus>("queued");
  const [isCancelling, setIsCancelling] = useState(false);

  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

  /* ---------- Clear Terminal ---------- */
  useEffect(() => {
    const clearHandler = () => {
      terminalInstanceRef.current?.reset();
      terminalInstanceRef.current?.writeln(
        "\x1b[32m[Logs cleared]\x1b[0m"
      );
    };

    globalThis.addEventListener(TERMINAL_CLEAR_EVENT, clearHandler);
    return () =>
      globalThis.removeEventListener(TERMINAL_CLEAR_EVENT, clearHandler);
  }, []);

  /* ---------- Init Terminal + Socket ---------- */
  useEffect(() => {
    if (!terminalRef.current || terminalInstanceRef.current) return;

    const term = new Terminal({
      theme: {
        background: "#1e1e1e",
        foreground: "#ffffff",
        cursor: "#ffffff",
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      cursorBlink: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    terminalInstanceRef.current = term;

    setTimeout(() => fitAddon.fit(), 100);

    const resizeHandler = () => {
      try {
        fitAddon.fit();
      } catch {}
    };

    globalThis.addEventListener("resize", resizeHandler);

    const wsToken = resolveWsAuthToken(token);

    const socket = io(`${resolveTerminalSocketUrl()}/runs`, {
      // Backend gateway is namespace "runs" with Socket.IO path "/runs/socket.io".
      // We must set the client "path" to match, otherwise Socket.IO will hit "/socket.io" and fail
      // with "Invalid namespace".
      path: "/runs/socket.io",
      transports: ["websocket"],
      query: { runId },
      auth: wsToken ? { token: wsToken } : undefined,
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      term.writeln("\x1b[32m[Connected to run]\x1b[0m");
    });

    socket.on("run-event", (msg: RunStreamEvent) => {
      if (msg.type === "stdout") term.write(msg.data);
      if (msg.type === "stderr")
        term.write(`\x1b[31m${msg.data}\x1b[0m`);
      if (msg.type === "status") {
        setStatus(msg.data);
        term.writeln(
          `\n\x1b[36m[status]\x1b[0m ${msg.data}${
            msg.reason ? ` (${msg.reason})` : ""
          }\n`
        );
      }
    });

    socket.on("disconnect", () => {
      term.writeln("\x1b[31m[Disconnected]\x1b[0m");
    });

    socket.on("connect_error", () => {
      term.writeln(
        "\x1b[33m[Connection error – retrying]\x1b[0m"
      );
    });

    term.writeln(
      `\x1b[1;32m➜\x1b[0m \x1b[1;36mrun:${runId}\x1b[0m started...\n`
    );

    return () => {
      globalThis.removeEventListener("resize", resizeHandler);
      socket.disconnect();
      term.dispose();
      terminalInstanceRef.current = null;
    };
  }, [apiBaseUrl, runId, token]);

  /* ---------- Cancel Run ---------- */
  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      await cancelRun(runId);
      setStatus("cancelled");
    } catch (err) {
      console.error("Cancel failed", err);
    } finally {
      setIsCancelling(false);
    }
  };

  const disableCancel =
    isCancelling ||
    ["completed", "failed", "cancelled", "timed_out"].includes(status);

  /* ---------- UI ---------- */
  return (
    <div className="flex h-full w-full flex-col bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#333]">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-400">Run:</span>
          <code className="text-white">{runId}</code>
          <span
            className={cn(
              "px-2 py-1 text-xs rounded-full border",
              status === "running" && "border-emerald-500 text-emerald-400 animate-pulse",
              status === "queued" && "border-amber-500 text-amber-400 animate-pulse",
              status === "completed" && "border-blue-500 text-blue-400",
              status === "failed" && "border-red-500 text-red-400",
              status === "cancelled" && "border-gray-500 text-gray-300",
              status === "timed_out" && "border-orange-500 text-orange-400"
            )}
          >
            {status}
          </span>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={handleCancel}
          disabled={disableCancel}
        >
          {isCancelling ? "Cancelling..." : "Cancel"}
        </Button>
      </div>

      <div
        ref={terminalRef}
        className="flex-1 bg-[#1e1e1e] overflow-hidden pl-2 pt-2"
      />
    </div>
  );
};

export default TerminalComponent;
