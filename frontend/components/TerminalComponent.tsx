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

type RunStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

type RunStreamEvent =
  | { type: "stdout"; data: string; timestamp?: string }
  | { type: "stderr"; data: string; timestamp?: string }
  | {
      type: "status";
      data: RunStatus;
      reason?: string;
      timestamp?: string;
    };

type TerminalComponentProps = {
  runId: string;
  token?: string;
};

const TerminalComponent = ({ runId, token }: TerminalComponentProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<RunStatus>("queued");
  const [isCancelling, setIsCancelling] = useState(false);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!terminalRef.current || !mounted || terminalInstanceRef.current) return;

    try {
      // Initialize terminal
      const term = new Terminal({
        theme: {
          background: "#1e1e1e",
          foreground: "#ffffff",
          cursor: "#ffffff",
        },
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        cursorBlink: true,
        rows: 20,
      });

      terminalInstanceRef.current = term;

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);

      // Initial fit
      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch (error) {
          console.error("Error fitting terminal:", error);
        }
      }, 100);

      // Handle window resize
      const handleResize = () => {
        try {
          fitAddon.fit();
        } catch (error) {
          console.error("Error resizing terminal:", error);
        }
      };
      window.addEventListener("resize", handleResize);

      // Connect to backend run stream using dedicated path (no namespace)
      const socket = io(apiBaseUrl, {
        transports: ["websocket"],
        auth: { token },
        path: "/runs",
        query: { runId, ...(token ? { token } : {}) },
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        term.writeln("\x1b[32m[Connected to run stream]\x1b[0m");
      });

      socket.on("run-event", (msg: RunStreamEvent) => {
        if (msg.type === "stdout") {
          term.write(msg.data);
        } else if (msg.type === "stderr") {
          term.write(`\x1b[31m${msg.data}\x1b[0m`);
        } else if (msg.type === "status") {
          setStatus(msg.data);
          const reasonText = msg.reason ? ` (${msg.reason})` : "";
          term.writeln(
            `\r\n\x1b[36m[status]\x1b[0m ${msg.data}${reasonText}\r\n`
          );
        }
      });

      socket.on("disconnect", () => {
        term.writeln("\x1b[31m[Disconnected from server]\x1b[0m");
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        term.writeln(
          "\x1b[33m[Connection error - check token or server]\x1b[0m"
        );
      });

      // Optional: display initial prompt
      term.writeln(
        `\x1b[1;32m➜\x1b[0m \x1b[1;36mrun:${runId}\x1b[0m streaming logs...`
      );

      return () => {
        window.removeEventListener("resize", handleResize);
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.dispose();
          terminalInstanceRef.current = null;
        }
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    } catch (error) {
      console.error("Error initializing terminal:", error);
    }
  }, [apiBaseUrl, mounted, runId, token]);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await cancelRun(runId);
      setStatus("cancelled");
    } catch (error) {
      console.error("Failed to cancel run", error);
    } finally {
      setIsCancelling(false);
    }
  };

  const disableCancel = isCancelling || ["succeeded", "failed", "cancelled"].includes(status);

  return (
    <div className="flex h-full w-full flex-col bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#333]">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-300">Run ID:</span>
          <code className="text-gray-100">{runId}</code>
          <span
            className={cn(
              "text-xs rounded-full px-2 py-1 border",
              status === "running" && "border-emerald-500 text-emerald-400",
              status === "queued" && "border-amber-500 text-amber-400",
              status === "succeeded" && "border-blue-500 text-blue-400",
              status === "failed" && "border-red-500 text-red-400",
              status === "cancelled" && "border-gray-500 text-gray-300"
            )}
          >
            {status}
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCancel}
          disabled={disableCancel}
        >
          {isCancelling ? "Cancelling..." : "Cancel run"}
        </Button>
      </div>
      <div
        className="h-full w-full bg-[#1e1e1e] pl-2 pt-2 overflow-hidden"
        ref={terminalRef}
      />
    </div>
  );
};

export default TerminalComponent;
