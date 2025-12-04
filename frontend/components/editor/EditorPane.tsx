"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MonacoEditor from "./MonacoEditor";
import TabsBar from "./TabsBar";
import type { FileEntity } from "@/types/editor";
import { getFile } from "@/lib/api/files";
import {
  createRun,
  getRunLogs,
  getRunStatus,
  type RunResponse,
  type RunStatus,
} from "@/lib/api/run";
import { downloadTextFile } from "@/lib/utils";
import { connectRunWebSocket } from "@/lib/runWebSocket";
import { Download, Loader2, Play, RotateCcw, Share2 } from "lucide-react";

interface EditorPaneProps {
  workspaceId: string;
  fileId: string | null;
  onActiveFileChange?: (fileId: string | null) => void;
}

const POLL_INTERVAL_MS = 3000;
const TERMINAL_CLEAR_EVENT = "nebula-terminal-clear";

interface RunSnapshot {
  runId: string;
  status: RunStatus;
  fileId: string;
  fileName: string;
  createdAt?: string;
  updatedAt?: string;
}

const isRunActive = (status: RunStatus) => status === "queued" || status === "running";
const isTerminalStatus = (status: RunStatus) =>
  status === "completed" || status === "failed" || status === "cancelled";

const EditorPane = ({ workspaceId, fileId, onActiveFileChange }: EditorPaneProps) => {
  const [openTabs, setOpenTabs] = useState<FileEntity[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<FileEntity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [runStates, setRunStates] = useState<Record<string, RunSnapshot>>({});
  const [isRunRequestPending, setIsRunRequestPending] = useState(false);
  const [logsDownloadPending, setLogsDownloadPending] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const [isManualStatusRefreshPending, setIsManualStatusRefreshPending] = useState(false);
  const pendingFileIdRef = useRef<string | null>(fileId);
  const isMountedRef = useRef(true);
  const runStatesRef = useRef<Record<string, RunSnapshot>>({});

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    runStatesRef.current = runStates;
  }, [runStates]);

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
      setRunStates({});
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

  const upsertRunSnapshot = (file: FileEntity, response: RunResponse) => {
    setRunStates((prev) => ({
      ...prev,
      [file.id]: {
        runId: response.runId,
        status: response.status,
        fileId: file.id,
        fileName: file.name ?? file.path ?? file.id,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      },
    }));
  };

  const dispatchTerminalClear = () => {
    if (typeof window === "undefined") {
      return;
    }
    window.dispatchEvent(new CustomEvent(TERMINAL_CLEAR_EVENT));
  };

  const activeRun = activeFile ? runStates[activeFile.id] ?? null : null;

  const isAnyRunInFlight = useMemo(
    () => Object.values(runStates).some((run) => run && isRunActive(run.status)),
    [runStates]
  );

  const globalInFlightRun = useMemo<RunSnapshot | null>(() => {
    return Object.values(runStates).find((run) => run && isRunActive(run.status)) ?? null;
  }, [runStates]);

  const displayedRun = activeRun
    ? activeRun
    : globalInFlightRun && activeRun?.runId !== globalInFlightRun.runId
      ? globalInFlightRun
      : null;

  const activeRunInFlight = Boolean(activeRun && isRunActive(activeRun.status));
  const hasOtherRunInFlight = isAnyRunInFlight && !activeRunInFlight;

  const runButtonDisabled =
    !activeFile ||
    isLoading ||
    isRunRequestPending ||
    activeRunInFlight ||
    hasOtherRunInFlight;

  const runButtonTooltip = !activeFile
    ? "Open a file to run"
    : isLoading
      ? "File is still loading"
      : isRunRequestPending
        ? "Starting run"
        : activeRunInFlight
          ? "This file already has a run in progress"
          : hasOtherRunInFlight
            ? "Another file is currently running"
            : undefined;

  const canRerun = Boolean(
    activeFile &&
    activeRun &&
    isTerminalStatus(activeRun.status) &&
    !isAnyRunInFlight
  );
  const canDownloadLogs = Boolean(activeRun && isTerminalStatus(activeRun.status));

  const handleRun = async () => {
    const fileSnapshot = activeFile;
    if (
      !fileSnapshot ||
      isRunRequestPending ||
      activeRunInFlight ||
      hasOtherRunInFlight
    ) {
      return;
    }

    setRunError(null);
    setIsRunRequestPending(true);
    try {
      const response = await createRun({
        workspaceId,
        fileId: fileSnapshot.id,
        language: fileSnapshot.language,
      });

      upsertRunSnapshot(fileSnapshot, response);
      dispatchTerminalClear();
    } catch (error) {
      console.error("Failed to start run", error);
      setRunError("Unable to start run. Please try again.");
    } finally {
      setIsRunRequestPending(false);
    }
  };

  const handleDownloadLogs = async () => {
    if (!activeRun || !canDownloadLogs || logsDownloadPending) {
      return;
    }

    setRunError(null);
    setLogsDownloadPending(true);
    try {
      const payload = await getRunLogs(activeRun.runId);
      const filename = payload.filename || `run-${activeRun.runId}.log`;
      downloadTextFile(filename, payload.content);
    } catch (error) {
      console.error("Failed to download logs", error);
      setRunError("Unable to download logs right now. Please try again.");
    } finally {
      setLogsDownloadPending(false);
    }
  };

  const refreshActiveRunStatuses = useCallback(async () => {
    const entries = Object.entries(runStatesRef.current).filter(
      ([, snapshot]) => (snapshot ? isRunActive(snapshot.status) : false)
    ) as Array<[string, RunSnapshot]>;

    if (!entries.length) {
      setPollingError(null);
      return;
    }

    try {
      const updates = await Promise.all(
        entries.map(async ([fileKey, snapshot]) => {
          const data = await getRunStatus(snapshot.runId);
          return { fileKey, data };
        })
      );

      setRunStates((prev) => {
        const next = { ...prev } as Record<string, RunSnapshot>;
        for (const update of updates) {
          const existing = next[update.fileKey];
          next[update.fileKey] = {
            fileId: update.fileKey,
            fileName: existing?.fileName ?? update.data.fileId,
            runId: update.data.runId,
            status: update.data.status,
            createdAt: update.data.createdAt,
            updatedAt: update.data.updatedAt,
          };
        }
        return next;
      });
      setPollingError(null);
    } catch (error) {
      console.error("Failed to refresh run status", error);
      setPollingError("Unable to refresh run status. Retrying automatically.");
    }
  }, []);

  const handleManualStatusRefresh = async () => {
    if (isManualStatusRefreshPending) {
      return;
    }
    setIsManualStatusRefreshPending(true);
    try {
      await refreshActiveRunStatuses();
    } finally {
      setIsManualStatusRefreshPending(false);
    }
  };

  useEffect(() => {
    if (!isAnyRunInFlight) {
      setPollingError(null);
      return;
    }

    const tick = () => {
      void refreshActiveRunStatuses();
    };

    tick();
    const intervalId = window.setInterval(tick, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAnyRunInFlight, refreshActiveRunStatuses]);

  useEffect(() => {
    if (!activeRun?.runId) {
      return;
    }

    const currentRun = activeRun;

    const disconnect = connectRunWebSocket(currentRun.runId, {
      onStatus: (payload) => {
        setRunStates((prev) => {
          const existing = prev[currentRun.fileId];
          return {
            ...prev,
            [currentRun.fileId]: {
              fileId: currentRun.fileId,
              fileName: existing?.fileName ?? currentRun.fileName,
              runId: currentRun.runId,
              status: (payload.status as RunStatus) ?? existing?.status ?? "unknown",
              createdAt: existing?.createdAt,
              updatedAt: payload.updatedAt ?? new Date().toISOString(),
            },
          };
        });
      },
      onLog: (payload) => {
        console.warn(
          "[RunWebSocket] Received log payload before streaming is wired up:",
          payload,
        );
      },
      onError: (error) => {
        console.warn(
          `[RunWebSocket] Placeholder connection error for run ${currentRun.runId}:`,
          error,
        );
      },
    });

    return () => {
      disconnect();
    };
  }, [activeRun]);

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
          {displayedRun ? (
            <div className="flex items-center gap-2">
              <RunStatusPill status={displayedRun.status} />
              {!activeRun && displayedRun.fileName ? (
                <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-gray-300">
                  {displayedRun.fileName}
                </span>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => {
              void handleRun();
            }}
            disabled={runButtonDisabled}
            title={runButtonTooltip}
            className="flex items-center gap-2 rounded bg-green-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition enabled:hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRunRequestPending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {isRunRequestPending ? "Starting..." : "Run"}
          </button>
          {canRerun ? (
            <button
              type="button"
              onClick={() => {
                void handleRun();
              }}
              className="flex items-center gap-2 rounded bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-slate-600"
            >
              <RotateCcw size={14} /> Rerun
            </button>
          ) : null}
          {canDownloadLogs ? (
            <button
              type="button"
              onClick={() => {
                void handleDownloadLogs();
              }}
              disabled={logsDownloadPending}
              className="flex items-center gap-2 rounded bg-indigo-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition enabled:hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {logsDownloadPending ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {logsDownloadPending ? "Preparing..." : "Download Logs"}
            </button>
          ) : null}
          <button
            type="button"
            className="flex items-center gap-2 rounded bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-blue-500"
          >
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>

      {runError ? (
        <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-300">
          {runError}
        </div>
      ) : null}

      {pollingError ? (
        <div className="flex items-center justify-between gap-3 bg-yellow-900/40 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-wide text-yellow-100">
          <span>{pollingError}</span>
          <button
            type="button"
            onClick={() => {
              void handleManualStatusRefresh();
            }}
            disabled={isManualStatusRefreshPending}
            className="rounded bg-yellow-600 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-yellow-50 transition enabled:hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isManualStatusRefreshPending ? "Refreshing..." : "Retry now"}
          </button>
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
