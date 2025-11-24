"use client";
import { useEffect, useRef } from "react";
import "@xterm/xterm/css/xterm.css";

const TerminalComponent = () => {
    const terminalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let disposeTerminal: (() => void) | undefined;
        let handleResize: (() => void) | undefined;

        const bootstrapTerminal = async () => {
            if (!terminalRef.current) {
                return;
            }

            const [{ Terminal }, { FitAddon }] = await Promise.all([
                import("@xterm/xterm"),
                import("@xterm/addon-fit"),
            ]);

            const term = new Terminal({
                theme: {
                    background: "#1e1e1e",
                    foreground: "#ffffff",
                    cursor: "#ffffff",
                },
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                fontSize: 14,
                cursorBlink: true,
                rows: 10,
            });
            const fitAddon = new FitAddon();
            term.loadAddon(fitAddon);
            term.open(terminalRef.current);

            setTimeout(() => {
                fitAddon.fit();
            }, 100);

            handleResize = () => fitAddon.fit();
            window.addEventListener("resize", handleResize);

            term.writeln("\x1b[1;32m➜\x1b[0m \x1b[1;36mnebula-code\x1b[0m git:(main) npm run dev");
            term.writeln("   \x1b[1;32mready\x1b[0m - started server on 0.0.0.0:3000, url: http://localhost:3000");
            term.writeln("");
            term.write("\x1b[1;32m➜\x1b[0m \x1b[1;36mnebula-code\x1b[0m git:(main) ");

            term.onData((data) => {
                term.write(data);
            });

            disposeTerminal = () => {
                if (handleResize) {
                    window.removeEventListener("resize", handleResize);
                }
                term.dispose();
            };
        };

        void bootstrapTerminal();

        return () => {
            disposeTerminal?.();
        };
    }, []);

    return <div className="h-full w-full bg-[#1e1e1e] pl-2 pt-2 overflow-hidden" ref={terminalRef} />;
};

export default TerminalComponent;
