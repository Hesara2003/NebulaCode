"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MonacoEditor from "./MonacoEditor";
import TabsBar from "./TabsBar";
import type { FileEntity } from "@/types/editor";
import { getFile } from "@/lib/api/files";
import { Play, Share2 } from "lucide-react";
import { useCollaborationStore } from "@/lib/yjs";
import { getAwareness, getDocumentText } from "@/lib/yjs/document";
import type { OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditorNS } from "monaco-editor";

type MonacoBindingClass = typeof import("y-monaco")["MonacoBinding"];
type MonacoBindingInstance = InstanceType<MonacoBindingClass>;

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
  const [sharedContent, setSharedContent] = useState<string>("");
  const [showConflictBanner, setShowConflictBanner] = useState<boolean>(false);
  const pendingFileIdRef = useRef<string | null>(fileId);
  const isMountedRef = useRef(true);
  const editorInstanceRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBindingInstance | null>(null);
  const bindingClassRef = useRef<MonacoBindingClass | null>(null);
  const currentDocumentIdRef = useRef<string | null>(null);

  const joinDocument = useCollaborationStore((state) => state.joinDocument);
  const leaveDocument = useCollaborationStore((state) => state.leaveDocument);
  const initializeDocument = useCollaborationStore((state) => state.initializeDocument);
  const lastRemoteUpdate = useCollaborationStore((state) => state.lastRemoteUpdate);
  const clearRemoteUpdate = useCollaborationStore((state) => state.clearRemoteUpdate);
  const currentUser = useCollaborationStore((state) => state.currentUser);

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
          />
        </div>
        <div className="hidden items-center gap-3 px-4 sm:flex">
          <button className="flex items-center gap-2 rounded bg-green-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-green-600">
            <Play size={14} /> Run
          </button>
          <button className="flex items-center gap-2 rounded bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-blue-500">
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>

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

export default EditorPane;
