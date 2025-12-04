"use client";
import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { io } from "socket.io-client";
import { getApiBaseUrl } from "@/lib/api/httpClient";

const resolveTerminalSocketUrl = () => {
  const explicitTerminalUrl = process.env.NEXT_PUBLIC_TERMINAL_SOCKET_URL;
  const fallbackSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  const baseUrl = explicitTerminalUrl ?? fallbackSocketUrl ?? getApiBaseUrl();
  return baseUrl.replace(/\/$/, "");
};

const TERMINAL_CLEAR_EVENT = "nebula-terminal-clear";

const TerminalComponent = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);

  useEffect(() => {
    const handleClear = () => {
      if (!terminalInstanceRef.current) {
        return;
      }
      terminalInstanceRef.current.reset();
      terminalInstanceRef.current.writeln(
        "\x1b[32m[Cleared logs before rerun]\x1b[0m",
      );
    };

    window.addEventListener(TERMINAL_CLEAR_EVENT, handleClear);
    return () => {
      window.removeEventListener(TERMINAL_CLEAR_EVENT, handleClear);
    };
  }, []);

  useEffect(() => {
    if (!terminalRef.current || terminalInstanceRef.current) return;

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

      // Connect to backend via Socket.IO
      const socket = io(resolveTerminalSocketUrl(), {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        transports: ["websocket"],
      });

      socket.on("connect", () => {
        term.writeln("\x1b[32m[Connected to server]\x1b[0m");
      });

      socket.on("message", (msg: string) => {
        term.writeln(msg);
      });

      socket.on("disconnect", () => {
        term.writeln("\x1b[31m[Disconnected from server]\x1b[0m");
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        term.writeln("\x1b[33m[Connection error - retrying...]\x1b[0m");
      });

      // Send terminal input to backend
      term.onData((data) => {
        socket.emit("message", data);
      });

      // Optional: display initial prompt
      term.writeln('\x1b[1;32m➜\x1b[0m \x1b[1;36mnebula-code\x1b[0m git:(main) ');

      return () => {
        window.removeEventListener("resize", handleResize);
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.dispose();
          terminalInstanceRef.current = null;
        }
        socket.disconnect();
      };
    } catch (error) {
      console.error("Error initializing terminal:", error);
    }
  }, []);

  return (
    <div
      className="h-full w-full bg-[#1e1e1e] pl-2 pt-2 overflow-hidden"
      ref={terminalRef}
    />
  );
};

export default TerminalComponent;
