"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const RESIZE_DEBOUNCE_MS = 150;
const RECONNECTION_DELAY_MIN = 1000;
const RECONNECTION_DELAY_MAX = 10000;
const MAX_RECONNECTION_ATTEMPTS = 10;

// ANSI color codes for message types
const ANSI_COLORS = {
  system: "\x1b[36m", // Cyan for system messages
  success: "\x1b[32m", // Green for success
  error: "\x1b[31m", // Red for errors
  warning: "\x1b[33m", // Yellow for warnings
  reset: "\x1b[0m", // Reset
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

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

/* ---------------- UTILITY FUNCTIONS ---------------- */

/**
 * Safely write to terminal with error handling, duplicate prevention, and auto-scroll
 */
const safeTerminalWrite = (
  term: Terminal | null,
  data: string,
  isError = false,
  shouldAutoScroll = true
): void => {
  if (!term) return;
  try {
    // Write data directly - terminal handles ANSI codes
    term.write(data);
    
    // Auto-scroll to bottom after writing
    if (shouldAutoScroll) {
      // Use setTimeout to ensure the write has been processed
      setTimeout(() => {
        try {
          const element = term.element;
          if (element) {
            const viewport = element.querySelector('.xterm-viewport') as HTMLElement;
            if (viewport) {
              viewport.scrollTop = viewport.scrollHeight;
            }
          }
        } catch (error) {
          // Silently fail if scroll fails
        }
      }, 0);
    }
  } catch (error) {
    console.error("[Terminal] Write error:", error);
  }
};

/**
 * Safely write line to terminal with error handling
 */
const safeTerminalWriteln = (term: Terminal | null, data: string): void => {
  if (!term) return;
  try {
    term.writeln(data);
  } catch (error) {
    console.error("[Terminal] Writeln error:", error);
  }
};

/**
 * Write system message with consistent formatting
 */
const writeSystemMessage = (
  term: Terminal | null,
  message: string,
  type: "info" | "success" | "warning" | "error" = "info"
): void => {
  if (!term) return;
  try {
    const color =
      type === "success"
        ? ANSI_COLORS.success
        : type === "warning"
        ? ANSI_COLORS.warning
        : type === "error"
        ? ANSI_COLORS.error
        : ANSI_COLORS.system;
    const prefix = `${color}${ANSI_COLORS.bold}[${type.toUpperCase()}]${ANSI_COLORS.reset}${color}`;
    term.writeln(`${prefix} ${message}${ANSI_COLORS.reset}`);
  } catch (error) {
    console.error("[Terminal] System message error:", error);
  }
};

/**
 * Write status update with proper formatting
 */
const writeStatusUpdate = (
  term: Terminal | null,
  status: RunStatus,
  reason?: string
): void => {
  if (!term) return;
  try {
    let statusColor = ANSI_COLORS.system;
    let statusText = status;

    switch (status) {
      case "queued":
        statusColor = ANSI_COLORS.warning;
        statusText = "QUEUED";
        break;
      case "running":
        statusColor = ANSI_COLORS.success;
        statusText = "RUNNING";
        break;
      case "completed":
        statusColor = ANSI_COLORS.success;
        statusText = "COMPLETED";
        break;
      case "failed":
        statusColor = ANSI_COLORS.error;
        statusText = "FAILED";
        break;
      case "cancelled":
        statusColor = ANSI_COLORS.dim;
        statusText = "CANCELLED";
        break;
      case "timed_out":
        statusColor = ANSI_COLORS.warning;
        statusText = "TIMED OUT";
        break;
    }

    const statusLine = `\n${ANSI_COLORS.system}${ANSI_COLORS.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${ANSI_COLORS.reset}`;
    term.writeln(statusLine);
    term.writeln(
      `${ANSI_COLORS.system}${ANSI_COLORS.bold}[STATUS]${ANSI_COLORS.reset} ${statusColor}${statusText}${ANSI_COLORS.reset}${reason ? ` ${ANSI_COLORS.dim}(${reason})${ANSI_COLORS.reset}` : ""}`
    );
    term.writeln(statusLine);
    term.writeln(""); // Empty line for spacing
  } catch (error) {
    console.error("[Terminal] Status update error:", error);
  }
};

/**
 * Debounce function for resize handler
 */
const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/* ---------------- COMPONENT ---------------- */

const TerminalComponent = ({ runId, token }: TerminalComponentProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const resizeHandlerRef = useRef<(() => void) | null>(null);
  const scrollHandlerRef = useRef<(() => void) | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);
  const previousRunIdRef = useRef<string | null>(null);
  const eventHandlersRef = useRef<Map<string, (...args: unknown[]) => void>>(
    new Map()
  );
  const shouldAutoScrollRef = useRef(true);

  const [status, setStatus] = useState<RunStatus>("queued");
  const [isCancelling, setIsCancelling] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");

  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

  /* ---------- Cleanup function ---------- */
  const cleanup = useCallback(() => {
    // Cleanup socket event listeners
    if (socketRef.current) {
      try {
        // Remove all registered event handlers
        eventHandlersRef.current.forEach((handler, event) => {
          socketRef.current?.off(event, handler);
        });
        eventHandlersRef.current.clear();
        
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      } catch (error) {
        console.error("[Terminal] Socket cleanup error:", error);
      }
      socketRef.current = null;
    }

    // Cleanup resize handler
    if (resizeHandlerRef.current) {
      globalThis.removeEventListener("resize", resizeHandlerRef.current);
      resizeHandlerRef.current = null;
    }

    // Cleanup scroll handler
    if (scrollHandlerRef.current) {
      scrollHandlerRef.current();
      scrollHandlerRef.current = null;
    }

    // Cleanup terminal
    if (terminalInstanceRef.current) {
      try {
        terminalInstanceRef.current.dispose();
      } catch (error) {
        console.error("[Terminal] Terminal disposal error:", error);
      }
      terminalInstanceRef.current = null;
    }

    fitAddonRef.current = null;
    reconnectAttemptsRef.current = 0;
    shouldAutoScrollRef.current = true;
  }, []);

  /* ---------- Clear Terminal ---------- */
  useEffect(() => {
    const clearHandler = () => {
      const term = terminalInstanceRef.current;
      if (!term) return;
      try {
        // Only clear if terminal is not currently showing output for an active run
        // This prevents clearing while output is still streaming
        if (status === "queued" || status === "running") {
          // Don't clear if there's an active run - just add a separator
          term.writeln("");
          writeSystemMessage(term, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "info");
          term.writeln("");
        } else {
          // Safe to clear if run is completed/failed/cancelled
          term.reset();
          writeSystemMessage(term, "Terminal cleared", "info");
        }
      } catch (error) {
        console.error("[Terminal] Clear error:", error);
      }
    };

    globalThis.addEventListener(TERMINAL_CLEAR_EVENT, clearHandler);
    return () => {
      globalThis.removeEventListener(TERMINAL_CLEAR_EVENT, clearHandler);
    };
  }, [status]);

  /* ---------- Init Terminal + Socket ---------- */
  useEffect(() => {
    // Only reset terminal when runId actually changes to a different run
    // Don't reset if terminal already exists and runId is the same
    const runIdChanged = previousRunIdRef.current !== null && previousRunIdRef.current !== runId;
    const terminalExists = terminalInstanceRef.current !== null;
    
    if (runIdChanged && terminalExists) {
      const term = terminalInstanceRef.current;
      if (term) {
        try {
          // Add separator instead of clearing to preserve history
          term.writeln("");
          writeSystemMessage(term, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "info");
          writeSystemMessage(term, `Switching to run: ${runId}`, "info");
          term.writeln("");
        } catch (error) {
          console.error("[Terminal] Reset error:", error);
        }
      }
    }
    
    previousRunIdRef.current = runId;

    // Cleanup previous socket connection when runId changes
    if (runIdChanged && socketRef.current) {
      try {
        eventHandlersRef.current.forEach((handler, event) => {
          socketRef.current?.off(event, handler);
        });
        eventHandlersRef.current.clear();
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      } catch (error) {
        console.error("[Terminal] Socket cleanup error:", error);
      }
      socketRef.current = null;
    }

    if (!terminalRef.current) return;

    isMountedRef.current = true;

    // Reuse existing terminal instance if it exists
    let term: Terminal;
    let fitAddon: FitAddon;
    let scrollCleanup: (() => void) | null = null;
    let isNewTerminal = false;

    if (terminalInstanceRef.current) {
      // Reuse existing terminal
      term = terminalInstanceRef.current;
      fitAddon = fitAddonRef.current!;
      isNewTerminal = false;
    } else {
      // Initialize new terminal
      isNewTerminal = true;
      try {
        term = new Terminal({
        theme: {
          background: "#1e1e1e",
          foreground: "#ffffff",
          cursor: "#ffffff",
          selection: "#264f78",
        },
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        cursorBlink: true,
        allowProposedApi: true,
        convertEol: true,
          scrollback: 10000, // Large scrollback buffer
          disableStdin: true, // Disable input
        });

        fitAddon = new FitAddon();
        
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        terminalInstanceRef.current = term;
        fitAddonRef.current = fitAddon;
      } catch (error) {
        console.error("[Terminal] Initialization error:", error);
        return;
      }
    }

    // Only set up scroll handler and fit for new terminals
    if (isNewTerminal) {
      try {

        // Enable auto-scroll by default
        shouldAutoScrollRef.current = true;

        // Track user scroll to disable auto-scroll when user scrolls up
        // Wait for terminal to be fully rendered
        const scrollTimeout = setTimeout(() => {
          const viewport = term.element?.querySelector('.xterm-viewport') as HTMLElement;
          if (viewport) {
            const handleScroll = () => {
              const isAtBottom =
                viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 10;
              shouldAutoScrollRef.current = isAtBottom;
            };
            viewport.addEventListener('scroll', handleScroll);
            
            // Store cleanup for scroll listener
            scrollCleanup = () => {
              viewport.removeEventListener('scroll', handleScroll);
            };
            scrollHandlerRef.current = scrollCleanup;
          }
        }, 200);

        // Fit terminal after a short delay to ensure DOM is ready
        const fitTimeout = setTimeout(() => {
          try {
            fitAddon.fit();
          } catch (error) {
            console.error("[Terminal] Initial fit error:", error);
          }
        }, 100);

        // Debounced resize handler
        const handleResize = debounce(() => {
          if (!isMountedRef.current || !fitAddon) return;
          try {
            fitAddon.fit();
          } catch (error) {
            console.error("[Terminal] Resize error:", error);
          }
        }, RESIZE_DEBOUNCE_MS);

        resizeHandlerRef.current = handleResize;
        globalThis.addEventListener("resize", handleResize);

        // Store cleanup for fit timeout
        const cleanupFitTimeout = () => clearTimeout(fitTimeout);
        const cleanupScrollTimeout = () => clearTimeout(scrollTimeout);
        
        // Return combined cleanup for new terminal
        return () => {
          cleanupFitTimeout();
          cleanupScrollTimeout();
          if (scrollCleanup) {
            scrollCleanup();
          }
        };
      } catch (error) {
        console.error("[Terminal] Setup error:", error);
      }
    } else {
      // For existing terminal, just refit on resize
      if (!resizeHandlerRef.current) {
        const handleResize = debounce(() => {
          if (!isMountedRef.current || !fitAddon) return;
          try {
            fitAddon.fit();
          } catch (error) {
            console.error("[Terminal] Resize error:", error);
          }
        }, RESIZE_DEBOUNCE_MS);

        resizeHandlerRef.current = handleResize;
        globalThis.addEventListener("resize", handleResize);
      }
    }

    // Initialize socket only if not already connected to this runId
    if (!socketRef.current || socketRef.current.disconnected) {
      const wsToken = resolveWsAuthToken(token);
      const socketUrl = `${resolveTerminalSocketUrl()}/runs`;

      const socket = io(socketUrl, {
        path: "/runs/socket.io",
        transports: ["websocket"],
        query: { runId },
        auth: wsToken ? { token: wsToken } : undefined,
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
        reconnectionDelay: RECONNECTION_DELAY_MIN,
        reconnectionDelayMax: RECONNECTION_DELAY_MAX,
        timeout: 20000,
        forceNew: true, // Create new connection for each runId
      });

      socketRef.current = socket;
      setConnectionStatus("connecting");

    // Socket event handlers with duplicate prevention
    const handleConnect = () => {
      if (!isMountedRef.current) return;
      reconnectAttemptsRef.current = 0;
      setConnectionStatus("connected");
      writeSystemMessage(term, "Connected to run stream", "success");
    };

    const handleDisconnect = (reason: string) => {
      if (!isMountedRef.current) return;
      setConnectionStatus("disconnected");
      if (reason !== "io client disconnect") {
        writeSystemMessage(
          term,
          `Disconnected: ${reason}`,
          reason === "io server disconnect" ? "warning" : "error"
        );
      }
    };

    const handleConnectError = (error: Error) => {
      if (!isMountedRef.current) return;
      reconnectAttemptsRef.current += 1;
      setConnectionStatus("error");
      console.error("[Terminal] Connection error:", error);
      writeSystemMessage(
        term,
        `Connection error – retrying (${reconnectAttemptsRef.current}/${MAX_RECONNECTION_ATTEMPTS})`,
        "warning"
      );
    };

    const handleReconnect = (attemptNumber: number) => {
      if (!isMountedRef.current) return;
      reconnectAttemptsRef.current = attemptNumber;
      writeSystemMessage(
        term,
        `Reconnecting... (${attemptNumber}/${MAX_RECONNECTION_ATTEMPTS})`,
        "warning"
      );
    };

    const handleReconnectFailed = () => {
      if (!isMountedRef.current) return;
      setConnectionStatus("error");
      writeSystemMessage(
        term,
        "Failed to reconnect after all attempts",
        "error"
      );
    };

    const handleError = (error: string) => {
      if (!isMountedRef.current) return;
      console.error("[Terminal] Socket error:", error);
      writeSystemMessage(term, `Socket error: ${error}`, "error");
      if (error === "missing-run-id") {
        setConnectionStatus("error");
      }
    };

    // Track processed events to prevent duplicates
    const processedEvents = new Set<string>();
    const handleRunEvent = (msg: RunStreamEvent) => {
      if (!isMountedRef.current) return;
      
      // Create unique event ID to prevent duplicates
      const eventId = `${msg.type}-${Date.now()}-${Math.random()}`;
      if (processedEvents.has(eventId)) {
        return;
      }
      processedEvents.add(eventId);
      
      // Clean up old event IDs to prevent memory leak
      if (processedEvents.size > 1000) {
        const eventsArray = Array.from(processedEvents);
        processedEvents.clear();
        eventsArray.slice(-100).forEach((id) => processedEvents.add(id));
      }

      try {
        if (msg.type === "stdout") {
          // Program output - write directly without modification
          safeTerminalWrite(term, msg.data, false, shouldAutoScrollRef.current);
        } else if (msg.type === "stderr") {
          // Error output - write with red color
          safeTerminalWrite(term, msg.data, true, shouldAutoScrollRef.current);
        } else if (msg.type === "status") {
          setStatus(msg.data);
          writeStatusUpdate(term, msg.data, msg.reason);
          
          // Auto-scroll after status update
          if (shouldAutoScrollRef.current) {
            setTimeout(() => {
              const viewport = term.element?.querySelector('.xterm-viewport') as HTMLElement;
              if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
              }
            }, 0);
          }
          
          // Handle cancelled status with specific message
          if (msg.data === "cancelled") {
            writeSystemMessage(
              term,
              "Run was cancelled by user",
              "warning"
            );
          }
        }
      } catch (error) {
        console.error("[Terminal] Event handling error:", error);
      }
    };

    // Register all socket event listeners and store references
    socket.on("connect", handleConnect);
    eventHandlersRef.current.set("connect", handleConnect);
    
    socket.on("disconnect", handleDisconnect);
    eventHandlersRef.current.set("disconnect", handleDisconnect);
    
    socket.on("connect_error", handleConnectError);
    eventHandlersRef.current.set("connect_error", handleConnectError);
    
    socket.on("reconnect", handleReconnect);
    eventHandlersRef.current.set("reconnect", handleReconnect);
    
    socket.on("reconnect_failed", handleReconnectFailed);
    eventHandlersRef.current.set("reconnect_failed", handleReconnectFailed);
    
    socket.on("error", handleError);
    eventHandlersRef.current.set("error", handleError);
    
    socket.on("run-event", handleRunEvent);
    eventHandlersRef.current.set("run-event", handleRunEvent);

    // Initial system message
    writeSystemMessage(term, `Starting run: ${runId}`, "info");
    term.writeln(""); // Empty line for spacing

    // Cleanup on unmount or runId change
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [runId, token, apiBaseUrl, cleanup]);

  /* ---------- Cancel Run ---------- */
  const handleCancel = useCallback(async () => {
    try {
      setIsCancelling(true);
      await cancelRun(runId);
      setStatus("cancelled");
      
      // Show cancellation message in terminal
      const term = terminalInstanceRef.current;
      if (term) {
        writeSystemMessage(term, "Cancellation requested...", "warning");
      }
    } catch (err) {
      console.error("[Terminal] Cancel failed:", err);
      const term = terminalInstanceRef.current;
      if (term) {
        writeSystemMessage(term, "Failed to cancel run", "error");
      }
    } finally {
      setIsCancelling(false);
    }
  }, [runId]);

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
              status === "running" &&
                "border-emerald-500 text-emerald-400 animate-pulse",
              status === "queued" &&
                "border-amber-500 text-amber-400 animate-pulse",
              status === "completed" && "border-blue-500 text-blue-400",
              status === "failed" && "border-red-500 text-red-400",
              status === "cancelled" && "border-gray-500 text-gray-300",
              status === "timed_out" && "border-orange-500 text-orange-400"
            )}
          >
            {status}
          </span>
          {connectionStatus === "connecting" && (
            <span className="text-xs text-amber-400 animate-pulse">
              Connecting...
            </span>
          )}
          {connectionStatus === "error" && (
            <span className="text-xs text-red-400">Connection Error</span>
          )}
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
