"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MonacoEditor from "./MonacoEditor";
import TabsBar from "./TabsBar";
import type { FileEntity } from "@/types/editor";
import { getFile } from "@/lib/api/files";
import { createRun, type RunStatus } from "@/lib/api/run";
import { Loader2, Play, Share2 } from "lucide-react";

interface EditorPaneProps {
  workspaceId: string;
  fileId: string | null;
  onActiveFileChange?: (fileId: string | null) => void;
}

const EditorPane = ({ workspaceId, fileId, onActiveFileChange }: EditorPaneProps) => {
  const [openTabs, setOpenTabs] = useState<FileEntity[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<FileEntity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<{ runId: string; status: RunStatus } | null>(null);
  const [isRunRequestPending, setIsRunRequestPending] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const pendingFileIdRef = useRef<string | null>(fileId);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const openFile = useCallback(
    async (targetFileId: string, options?: { optimisticActive?: boolean }) => {
      pendingFileIdRef.current = targetFileId;
      if (options?.optimisticActive) {
        setActiveTabId(targetFileId);
      }
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const data = await getFile(workspaceId, targetFileId);
        if (!isMountedRef.current) {
          return;
        }

        setActiveFile(data);
        setActiveTabId(data.id);
        onActiveFileChange?.(data.id);
        setActiveRun(null);
        setRunError(null);
        setOpenTabs((prev) => {
          const exists = prev.some((tab) => tab.id === data.id);
          if (exists) {
            return prev.map((tab) => (tab.id === data.id ? { ...tab, ...data } : tab));
          }
          return [...prev, data];
        });
      } catch (error) {
        console.error("Failed to load file", error);
        if (isMountedRef.current) {
          setErrorMessage("Unable to load file from the backend. Please try again.");
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [workspaceId, onActiveFileChange]
  );

  useEffect(() => {
    pendingFileIdRef.current = fileId;
    if (!fileId) {
      setActiveTabId(null);
      setActiveFile(null);
      setOpenTabs([]);
      setIsLoading(false);
      setErrorMessage(null);
      setActiveRun(null);
      setRunError(null);
      return;
    }

    void openFile(fileId);
  }, [fileId, openFile]);

  const handleSelectTab = (tabId: string) => {
    if (tabId === activeTabId) return;
    void openFile(tabId, { optimisticActive: true });
  };

  const handleCloseTab = (tabId: string) => {
    setOpenTabs((prev) => {
      const tabIndex = prev.findIndex((tab) => tab.id === tabId);
      if (tabIndex === -1) return prev;

      const updated = prev.filter((tab) => tab.id !== tabId);

      if (tabId === activeTabId) {
        const fallbackTab = updated[tabIndex] ?? updated[tabIndex - 1];
        if (fallbackTab) {
          void openFile(fallbackTab.id, { optimisticActive: true });
        } else {
          setActiveTabId(null);
          setActiveFile(null);
          onActiveFileChange?.(null);
        }
      }

      return updated;
    });
  };

  const handleRetry = () => {
    if (!pendingFileIdRef.current) {
      return;
    }
    void openFile(pendingFileIdRef.current, { optimisticActive: true });
  };

  const handleEditorChange = (value: string | undefined) => {
    setActiveFile((prev) =>
      prev
        ? {
            ...prev,
            content: value ?? prev.content ?? "",
          }
        : prev
    );
    setOpenTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTabId
          ? {
              ...tab,
              content: value ?? tab.content ?? "",
            }
          : tab
      )
    );
  };

  const handleRun = async () => {
    if (!activeFile || isRunRequestPending) {
      return;
    }

    setRunError(null);
    setIsRunRequestPending(true);
    try {
      const response = await createRun({
        workspaceId,
        fileId: activeFile.id,
        language: activeFile.language,
      });

      setActiveRun({ runId: response.runId, status: response.status });
    } catch (error) {
      console.error("Failed to start run", error);
      setRunError("Unable to start run. Please try again.");
    } finally {
      setIsRunRequestPending(false);
    }
  };

  const resolvedFile: FileEntity =
    activeFile ?? {
      id: "placeholder-file",
      name: "Loading.ts",
      path: "/Loading.ts",
      language: "typescript",
      content:
        "// Welcome to Monaco\n// Your file will appear as soon as the backend responds.\n",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

  return (
    <div className="flex h-full w-full flex-col bg-[#1e1e1e]">
      <div className="flex h-10 items-center border-b border-[#1e1e1e]">
        <div className="flex min-w-0 flex-1">
          <TabsBar
            tabs={openTabs}
            activeTabId={activeTabId}
            onSelect={handleSelectTab}
            onClose={handleCloseTab}
          />
        </div>
        <div className="hidden items-center gap-3 px-4 sm:flex">
          {activeRun ? (
            <RunStatusPill status={activeRun.status} />
          ) : null}
          <button
            type="button"
            onClick={() => {
              void handleRun();
            }}
            disabled={!activeFile || isLoading || isRunRequestPending || (activeRun && (activeRun.status === "queued" || activeRun.status === "running"))}
            title={!activeFile ? "Open a file to run" : isLoading ? "File is still loading" : undefined}
            className="flex items-center gap-2 rounded bg-green-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition enabled:hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRunRequestPending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {isRunRequestPending ? "Starting..." : "Run"}
          </button>
          <button className="flex items-center gap-2 rounded bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-blue-500">
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>

      {runError ? (
        <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-300">
          {runError}
        </div>
      ) : null}

      <div className="relative flex-1">
        {isLoading ? (
          <output className="absolute inset-0 z-10 flex items-center justify-center gap-3 bg-black/60 text-xs uppercase tracking-[0.3em] text-gray-100" aria-live="polite">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true"></span>
            <span>Loading file...</span>
          </output>
        ) : null}
        {errorMessage ? (
          <div className="absolute inset-x-0 bottom-4 z-20 mx-auto flex w-11/12 max-w-lg flex-col items-center gap-3 rounded-md border border-red-500/40 bg-red-900/50 px-4 py-3 text-center text-sm text-red-50">
            <p>{errorMessage}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded bg-red-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-red-400"
            >
              Retry
            </button>
          </div>
        ) : null}
        <MonacoEditor
          fileName={resolvedFile.name}
          language={resolvedFile.language}
          value={resolvedFile.content ?? ""}
          readOnly={isLoading}
          onChange={handleEditorChange}
        />
      </div>
    </div>
  );
};

const statusStyles: Record<RunStatus, { label: string; dot: string; text: string }> = {
  queued: { label: "Queued", dot: "bg-yellow-400", text: "text-yellow-200 bg-yellow-400/10" },
  running: { label: "Running", dot: "bg-emerald-400", text: "text-emerald-200 bg-emerald-400/10" },
  completed: { label: "Completed", dot: "bg-sky-400", text: "text-sky-100 bg-sky-500/10" },
  failed: { label: "Failed", dot: "bg-red-400", text: "text-red-200 bg-red-500/10" },
  cancelled: { label: "Cancelled", dot: "bg-gray-400", text: "text-gray-200 bg-gray-500/10" },
  unknown: { label: "Unknown", dot: "bg-purple-400", text: "text-purple-100 bg-purple-500/10" },
};

const RunStatusPill = ({ status }: { status: RunStatus }) => {
  const style = statusStyles[status] ?? statusStyles.unknown;
  return (
    <span className={`flex items-center gap-2 rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${style.text}`}>
      <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden="true" />
      {style.label}
    </span>
  );
};

export default EditorPane;
