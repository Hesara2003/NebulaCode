"use client";
import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { io } from "socket.io-client";

const TerminalComponent = () => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

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

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    // Initial fit
    setTimeout(() => fitAddon.fit(), 100);

    // Handle window resize
    const handleResize = () => fitAddon.fit();
    window.addEventListener("resize", handleResize);

    // Connect to backend via Socket.IO
    const socket = io("http://localhost:3000"); // backend URL

    socket.on("connect", () => {
      term.writeln("\x1b[32m[Connected to server]\x1b[0m");
    });

    socket.on("message", (msg: string) => {
      term.writeln(msg);
    });

    socket.on("disconnect", () => {
      term.writeln("\x1b[31m[Disconnected from server]\x1b[0m");
    });

    // Send terminal input to backend
    term.onData((data) => {
      socket.emit("message", data);
    });

    // Optional: display initial prompt
    term.writeln('\x1b[1;32m➜\x1b[0m \x1b[1;36mnebula-code\x1b[0m git:(main) ');

    return () => {
      window.removeEventListener("resize", handleResize);
      term.dispose();
      socket.disconnect();
    };
  }, []);

  return (
    <div
      className="h-full w-full bg-[#1e1e1e] pl-2 pt-2 overflow-hidden"
      ref={terminalRef}
    />
  );
};

export default TerminalComponent;
