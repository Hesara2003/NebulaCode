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
import { cancelRun } from "@/lib/api/runs";
import { downloadTextFile } from "@/lib/utils";
import { connectRunWebSocket } from "@/lib/runWebSocket";
import { Download, Loader2, Play, Share2, Save, Check, XCircle, CheckCircle, AlertTriangle, XOctagon, Clock } from "lucide-react";
import { saveFile } from "@/lib/api/files";
import { toast } from "@/lib/hooks/useToast";
import { useCollaborationStore } from "@/lib/yjs";
import { getAwareness, getDocumentText } from "@/lib/yjs/document";
import type { OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditorNS } from "monaco-editor";
import {
  getStoredRunState,
  storeRunId,
  clearStoredRunState,
  clearStaleRunStates,
  isRunStateStale,
  updateStoredRunStatus,
} from "@/lib/runStateStorage";

type MonacoBindingClass = typeof import("y-monaco")["MonacoBinding"];
type MonacoBindingInstance = InstanceType<MonacoBindingClass>;

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
  initiatedBy?: {
    id: string;
    name: string;
  };
  snapshotCreatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

const isRunActive = (status: RunStatus) => status === "queued" || status === "running";
const isTerminalStatus = (status: RunStatus) =>
  status === "completed" || status === "failed" || status === "cancelled" || status === "timed_out";

const EditorPane = ({ workspaceId, fileId, onActiveFileChange }: EditorPaneProps) => {
  const [openTabs, setOpenTabs] = useState<FileEntity[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<FileEntity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sharedContent, setSharedContent] = useState<string>("");
  const [showConflictBanner, setShowConflictBanner] = useState<boolean>(false);
  const [runStates, setRunStates] = useState<Record<string, RunSnapshot>>({});
  const [isRunRequestPending, setIsRunRequestPending] = useState(false);
  const [logsDownloadPending, setLogsDownloadPending] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const [isManualStatusRefreshPending, setIsManualStatusRefreshPending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isCancelPending, setIsCancelPending] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState<string>("");
  const [isRestoringRun, setIsRestoringRun] = useState(false);

  const pendingFileIdRef = useRef<string | null>(fileId);
  const isMountedRef = useRef(true);
  const editorInstanceRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBindingInstance | null>(null);
  const bindingClassRef = useRef<MonacoBindingClass | null>(null);
  const currentDocumentIdRef = useRef<string | null>(null);
  const runStatesRef = useRef<Record<string, RunSnapshot>>({});
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const joinDocument = useCollaborationStore((state) => state.joinDocument);
  const leaveDocument = useCollaborationStore((state) => state.leaveDocument);
  const initializeDocument = useCollaborationStore((state) => state.initializeDocument);
  const lastRemoteUpdate = useCollaborationStore((state) => state.lastRemoteUpdate);
  const clearRemoteUpdate = useCollaborationStore((state) => state.clearRemoteUpdate);
  const currentUser = useCollaborationStore((state) => state.currentUser);

  useEffect(() => {
    // Clean up stale run states on initial mount
    clearStaleRunStates();

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
        setLastSavedContent(data.content ?? "");
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
      setSharedContent("");
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

  const handleEditorMount: OnMount = (editor) => {
    editorInstanceRef.current = editor;
  };

  useEffect(() => {
    const documentId = activeFile?.id;
    const initialContent = activeFile?.content ?? "";

    let disposeTextObserver: (() => void) | undefined;

    const setupCollaboration = async () => {
      if (!documentId) {
        return;
      }

      currentDocumentIdRef.current = documentId;

      await joinDocument(documentId);
      initializeDocument(documentId, initialContent);

      const text = getDocumentText(documentId);

      const synchronizeState = () => {
        const nextContent = text.toString();
        setSharedContent(nextContent);
        setActiveFile((prev) =>
          prev && prev.id === documentId ? { ...prev, content: nextContent } : prev
        );
        setOpenTabs((prev) =>
          prev.map((tab) =>
            tab.id === documentId
              ? {
                ...tab,
                content: nextContent,
              }
              : tab
          )
        );
      };

      synchronizeState();

      const observer = () => {
        synchronizeState();
      };

      text.observe(observer);
      disposeTextObserver = () => {
        text.unobserve(observer);
      };
    };

    setupCollaboration().catch((error) => {
      console.error("[Collab] failed to setup document", error);
    });

    return () => {
      disposeTextObserver?.();
      if (documentId) {
        leaveDocument(documentId);
      }
      currentDocumentIdRef.current = null;
    };
  }, [activeFile?.id, activeFile?.content, initializeDocument, joinDocument, leaveDocument]);

  useEffect(() => {
    let disposed = false;

    const attachBinding = async () => {
      if (typeof window === "undefined") {
        return;
      }

      const editorInstance = editorInstanceRef.current;
      const documentId = currentDocumentIdRef.current;
      if (!editorInstance || !documentId) {
        return;
      }

      const model = editorInstance.getModel();
      if (!model) {
        return;
      }

      const awareness = getAwareness(documentId);
      awareness.setLocalState({
        userId: currentUser?.id ?? "guest",
        name: currentUser?.name ?? "Guest",
        color: currentUser?.color ?? "#6366F1",
      });

      if (!bindingClassRef.current) {
        const module = await import("y-monaco");
        if (disposed) {
          return;
        }
        bindingClassRef.current = module.MonacoBinding;
      }

      const Binding = bindingClassRef.current;
      if (!Binding) {
        return;
      }

      bindingRef.current?.destroy();
      bindingRef.current = new Binding(
        getDocumentText(documentId),
        model,
        new Set([editorInstance]),
        awareness
      );

      if (disposed) {
        bindingRef.current?.destroy();
        bindingRef.current = null;
      }
    };

    void attachBinding();

    return () => {
      disposed = true;
      bindingRef.current?.destroy();
      bindingRef.current = null;
    };
  }, [activeFile?.id, currentUser?.color, currentUser?.id, currentUser?.name]);

  useEffect(() => {
    if (!lastRemoteUpdate || lastRemoteUpdate.documentId !== currentDocumentIdRef.current) {
      return;
    }

    setShowConflictBanner(true);
    const timer = window.setTimeout(() => {
      setShowConflictBanner(false);
      clearRemoteUpdate();
    }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [lastRemoteUpdate, clearRemoteUpdate]);

  const upsertRunSnapshot = useCallback((file: FileEntity, response: RunResponse) => {
    setRunStates((prev) => ({
      ...prev,
      [file.id]: {
        runId: response.runId,
        status: response.status,
        fileId: file.id,
        fileName: file.name ?? file.path ?? file.id,
        initiatedBy: currentUser ? {
          id: currentUser.id,
          name: currentUser.name,
        } : undefined,
        snapshotCreatedAt: response.createdAt,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      },
    }));
  }, [currentUser]);

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

  const displayedRun = activeRun ?? globalInFlightRun;

  const activeRunInFlight = Boolean(activeRun && isRunActive(activeRun.status));
  const hasOtherRunInFlight = isAnyRunInFlight && !activeRunInFlight;

  // Check if there are unsaved changes
  const hasUnsavedChanges = sharedContent !== lastSavedContent;

  // Check if content has changed since run snapshot was created
  const hasChangedSinceRunStart = useMemo(() => {
    if (!activeRun || !activeRun.snapshotCreatedAt) return false;

    // If lastSavedAt is after snapshot creation, content has changed
    if (lastSavedAt && new Date(lastSavedAt) > new Date(activeRun.snapshotCreatedAt)) {
      return true;
    }

    // If there are unsaved changes, content has definitely changed
    return hasUnsavedChanges;
  }, [activeRun, lastSavedAt, hasUnsavedChanges]);

  // Check if current user started the run
  const isCurrentUserRun = useMemo(() => {
    if (!activeRun || !activeRun.initiatedBy || !currentUser) return false;
    return activeRun.initiatedBy.id === currentUser.id;
  }, [activeRun, currentUser]);

  // Get run attribution text
  const getRunAttribution = useCallback((run: RunSnapshot | null) => {
    if (!run || !run.initiatedBy) return null;

    if (currentUser && run.initiatedBy.id === currentUser.id) {
      return "you";
    }

    return run.initiatedBy.name;
  }, [currentUser]);

  const runButtonDisabled =
    !activeFile ||
    isLoading ||
    isRunRequestPending ||
    isSaving ||
    activeRunInFlight ||
    hasOtherRunInFlight;

  const runButtonTooltip = !activeFile
    ? "Open a file to run"
    : isLoading
      ? "File is still loading"
      : isSaving
        ? "Saving your changes..."
        : isRunRequestPending
          ? "Starting run"
          : activeRunInFlight
            ? isCurrentUserRun
              ? "Your run is in progress"
              : `Run in progress (started by ${getRunAttribution(activeRun)})`
            : hasOtherRunInFlight
              ? "Another file is currently running"
              : hasUnsavedChanges
                ? "Save and run code (Ctrl+Enter)"
                : "Run code (Ctrl+Enter)";

  const canDownloadLogs = Boolean(activeRun && isTerminalStatus(activeRun.status));

  // Restore run state after file is loaded
  useEffect(() => {
    if (!activeFile || isLoading) return;

    const restoreRunState = async () => {
      setIsRestoringRun(true);
      try {
        const storedState = getStoredRunState(activeFile.id);

        if (!storedState) {
          setIsRestoringRun(false);
          return;
        }

        // Check if the stored run is stale
        if (isRunStateStale(storedState)) {
          clearStoredRunState(activeFile.id);
          setIsRestoringRun(false);
          return;
        }

        // Fetch current status from backend
        const runStatus = await getRunStatus(storedState.runId);

        // Restore run state
        upsertRunSnapshot(activeFile, runStatus);

        // Update stored status
        updateStoredRunStatus(activeFile.id, runStatus.status);

        // Show appropriate toast based on status
        // Note: For now, we show simple messages. When backend adds initiatedBy to RunResponse,
        // we can enhance these with attribution
        if (isRunActive(runStatus.status)) {
          toast.info("Run in progress restored", 2000);
        } else if (runStatus.status === "completed") {
          toast.success("Last run completed successfully", 2000);
        } else if (runStatus.status === "failed") {
          toast.warning("Last run ended with errors", 3000);
        } else if (runStatus.status === "cancelled") {
          toast.info("Run was cancelled", 2000);
        } else if (runStatus.status === "timed_out") {
          toast.warning("Run took too long and was stopped", 3000);
        }
      } catch (error) {
        console.error("Failed to restore run state", error);
        // Silently fail - clear stored state and show fresh UI
        clearStoredRunState(activeFile.id);
      } finally {
        setIsRestoringRun(false);
      }
    };

    // Small delay to avoid flash of loading state
    const timer = setTimeout(() => {
      void restoreRunState();
    }, 100);

    return () => clearTimeout(timer);
  }, [activeFile, isLoading, currentUser, upsertRunSnapshot]);

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
      setRunError("Couldn't download logs. Check your connection and try again.");
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

          // Update status in localStorage
          updateStoredRunStatus(update.fileKey, update.data.status);
        }
        return next;
      });
      setPollingError(null);
    } catch (error) {
      console.error("Failed to refresh run status", error);
      setPollingError("Couldn't refresh run status. Retrying automatically.");
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

  const handleCancelRun = async () => {
    if (!activeRun || isCancelPending) return;

    setIsCancelPending(true);
    setRunError(null);
    try {
      await cancelRun(activeRun.runId);
      // Update the run state to cancelled
      setRunStates((prev) => {
        if (!activeFile) return prev;
        const existing = prev[activeFile.id];
        if (!existing) return prev;

        // Update status in localStorage
        updateStoredRunStatus(activeFile.id, "cancelled");

        return {
          ...prev,
          [activeFile.id]: {
            ...existing,
            status: "cancelled",
            updatedAt: new Date().toISOString(),
          },
        };
      });
    } catch (error) {
      console.error("Failed to cancel run", error);
      setRunError("Couldn't cancel run. Try again in a moment.");
    } finally {
      setIsCancelPending(false);
    }
  };

  const handleSave = useCallback(async () => {
    if (!activeFile || isSaving) return;

    setIsSaving(true);
    try {
      // Use sharedContent as it represents the latest state in the editor including Yjs updates
      const contentToSave = sharedContent;
      await saveFile(workspaceId, activeFile.id, contentToSave);
      setLastSavedAt(new Date());
      setLastSavedContent(contentToSave);
    } catch (error) {
      console.error("Failed to save file", error);
      setErrorMessage("Couldn't save your changes. Check your connection and try again.");
      throw error; // Re-throw to allow caller to handle
    } finally {
      setIsSaving(false);
    }
  }, [activeFile, isSaving, sharedContent, workspaceId]);

  const handleRun = useCallback(async () => {
    const fileSnapshot = activeFile;
    if (
      !fileSnapshot ||
      isRunRequestPending ||
      isSaving ||
      activeRunInFlight ||
      hasOtherRunInFlight
    ) {
      return;
    }

    setRunError(null);

    try {
      // Step 1: Auto-save if there are unsaved changes
      if (hasUnsavedChanges) {
        try {
          await handleSave();
          // Show brief success feedback
          toast.success("Saved and running...", 2000);
        } catch (saveError) {
          console.error("Failed to save before run", saveError);
          toast.error("Couldn't save your changes. Check your connection and try again.", 4000);
          return; // Don't proceed with run if save fails
        }
      }

      // Step 2: Execute run
      setIsRunRequestPending(true);
      const response = await createRun({
        workspaceId,
        fileId: fileSnapshot.id,
        language: fileSnapshot.language,
      });

      // Store runId in localStorage for restoration after refresh
      storeRunId(
        fileSnapshot.id,
        response.runId,
        fileSnapshot.name ?? fileSnapshot.path ?? fileSnapshot.id,
        response.createdAt,
        response.status
      );

      upsertRunSnapshot(fileSnapshot, response);
      dispatchTerminalClear();
    } catch (error) {
      console.error("Failed to start run", error);
      setRunError("Couldn't start run. Try again or check the terminal for details.");
      toast.error("Couldn't start run. Try again or check the terminal for details.", 4000);
    } finally {
      setIsRunRequestPending(false);
    }
  }, [activeFile, isRunRequestPending, isSaving, activeRunInFlight, hasOtherRunInFlight, hasUnsavedChanges, handleSave, workspaceId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S / Cmd+S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        void handleSave();
      }
      // Ctrl+Enter / Cmd+Enter: Run (with auto-save)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        void handleRun();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleRun]);

  // Auto-save with debouncing (2 seconds after typing stops)
  useEffect(() => {
    if (!activeFile || !hasUnsavedChanges || isSaving) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for auto-save
    autoSaveTimerRef.current = setTimeout(() => {
      setSaveStatus('saving');
      handleSave()
        .then(() => {
          setSaveStatus('saved');
          // Reset to idle after showing "saved" for 2 seconds
          setTimeout(() => setSaveStatus('idle'), 2000);
        })
        .catch(() => {
          setSaveStatus('error');
          toast.error('Auto-save failed. Your changes are still in the editor.', 3000);
        });
    }, 2000); // 2 second debounce

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [sharedContent, activeFile, hasUnsavedChanges, isSaving, handleSave]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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
          const newStatus = (payload.status as RunStatus) ?? existing?.status ?? "unknown";

          // Update status in localStorage
          updateStoredRunStatus(currentRun.fileId, newStatus);

          return {
            ...prev,
            [currentRun.fileId]: {
              fileId: currentRun.fileId,
              fileName: existing?.fileName ?? currentRun.fileName,
              runId: currentRun.runId,
              status: newStatus,
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
    activeFile
      ? { ...activeFile, content: sharedContent }
      : {
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
            unsavedTabIds={hasUnsavedChanges && activeFile ? [activeFile.id] : []}
          />
        </div>
        {/* Save status indicator */}
        <div className="flex items-center gap-2 px-2 text-xs">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-gray-400">
              <Loader2 size={12} className="animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-green-400">
              <Check size={12} />
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 text-red-400">
              <XCircle size={12} />
              Save failed
            </span>
          )}
          {hasUnsavedChanges && saveStatus === 'idle' && (
            <span className="text-gray-500">Unsaved</span>
          )}
        </div>
        <div className="hidden items-center gap-3 px-4 sm:flex">
          {displayedRun ? (
            <div className="flex items-center gap-2">
              <RunStatusPill
                status={displayedRun.status}
                attribution={getRunAttribution(displayedRun)}
              />
              {!activeRun && displayedRun.fileName ? (
                <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-gray-300">
                  {displayedRun.fileName}
                </span>
              ) : null}
            </div>
          ) : activeFile && !activeRun ? (
            <span className="flex items-center gap-2 rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-gray-400 bg-gray-500/10">
              <span className="h-2 w-2 rounded-full bg-gray-500" />
              Ready to Run
            </span>
          ) : null}
          <div className="flex items-center gap-2 mr-2">
            {isRestoringRun ? (
              <span className="flex items-center gap-1 text-[0.65rem] uppercase tracking-wide text-blue-400">
                <Loader2 size={10} className="animate-spin" /> Restoring...
              </span>
            ) : isSaving ? (
              <span className="flex items-center gap-1 text-[0.65rem] uppercase tracking-wide text-gray-400">
                <Loader2 size={10} className="animate-spin" /> Saving...
              </span>
            ) : lastSavedAt ? (
              <span className="flex items-center gap-1 text-[0.65rem] uppercase tracking-wide text-gray-500 transition-opacity duration-1000">
                <Check size={10} /> Saved
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || !activeFile}
            className="flex items-center gap-2 rounded bg-zinc-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-zinc-600 disabled:opacity-50"
            title="Save (Ctrl+S)"
          >
            <Save size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              void handleRun();
            }}
            disabled={runButtonDisabled}
            title={
              hasOtherRunInFlight && globalInFlightRun
                ? `File "${globalInFlightRun.fileName}" is currently running. Only one run allowed at a time.`
                : runButtonTooltip
            }
            className="flex items-center gap-2 rounded bg-green-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition enabled:hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isRunRequestPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : activeRun && isTerminalStatus(activeRun.status) ? (
              <Play size={14} />
            ) : (
              <Play size={14} />
            )}
            {isSaving
              ? "Saving"
              : isRunRequestPending
                ? "Starting run"
                : activeRunInFlight && activeRun?.status === "queued"
                  ? "Queued"
                  : activeRunInFlight && activeRun?.status === "running"
                    ? "Running"
                    : activeRun && isTerminalStatus(activeRun.status)
                      ? "Run Again"
                      : hasUnsavedChanges
                        ? "Save & Run"
                        : "Run"}
          </button>
          {activeRunInFlight && activeRun ? (
            <button
              type="button"
              onClick={() => void handleCancelRun()}
              disabled={isCancelPending}
              className="flex items-center gap-2 rounded bg-red-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition enabled:hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              title="Cancel this run"
            >
              {isCancelPending ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
              Cancel
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

      {activeRunInFlight && hasChangedSinceRunStart ? (
        <div className="flex items-center gap-2 bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-200">
          <AlertTriangle size={12} />
          <span>
            Running saved version{getRunAttribution(activeRun) ? ` (started by ${getRunAttribution(activeRun)})` : ""}. Your changes won&apos;t affect this run.
          </span>
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
        {showConflictBanner ? (
          <div className="pointer-events-none absolute top-4 right-4 z-20 rounded-md border border-amber-400/40 bg-amber-600/20 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-amber-200 shadow-lg">
            Collaborator edits applied
          </div>
        ) : null}
        <MonacoEditor
          key={resolvedFile.id}
          fileName={resolvedFile.name}
          language={resolvedFile.language}
          value={resolvedFile.content ?? ""}
          readOnly={isLoading}
          onMount={handleEditorMount}
        />
      </div>
    </div>
  );
};

const statusStyles: Record<RunStatus, { label: string; dot: string; text: string; icon?: React.ReactNode; animate?: string }> = {
  queued: { label: "Queued", dot: "bg-yellow-400 animate-pulse", text: "text-yellow-200 bg-yellow-400/10", animate: "animate-pulse" },
  running: { label: "Running", dot: "bg-emerald-400 animate-pulse", text: "text-emerald-200 bg-emerald-400/10", icon: <Loader2 size={12} className="animate-spin" />, animate: "animate-pulse" },
  completed: { label: "Completed", dot: "bg-sky-400", text: "text-sky-100 bg-sky-500/10", icon: <CheckCircle size={12} /> },
  failed: { label: "Ended with errors", dot: "bg-red-400", text: "text-red-200 bg-red-500/10", icon: <AlertTriangle size={12} /> },
  cancelled: { label: "Cancelled", dot: "bg-gray-400", text: "text-gray-200 bg-gray-500/10", icon: <XOctagon size={12} /> },
  timed_out: { label: "Took too long", dot: "bg-orange-400", text: "text-orange-200 bg-orange-500/10", icon: <Clock size={12} /> },
  unknown: { label: "Status unavailable", dot: "bg-purple-400", text: "text-purple-100 bg-purple-500/10" },
};

const RunStatusPill = ({ status, attribution }: { status: RunStatus; attribution?: string | null }) => {
  const style = statusStyles[status] ?? statusStyles.unknown;
  return (
    <span className={`flex items-center gap-2 rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${style.text}`}>
      {style.icon ? (
        style.icon
      ) : (
        <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden="true" />
      )}
      {style.label}
      {attribution && <span className="opacity-75">({attribution})</span>}
    </span>
  );
};

export default EditorPane;