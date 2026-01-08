"use client";

import Editor, { OnMount } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import type { editor } from "monaco-editor";
import { useCollaborationStore, createMonacoBinding, getAwareness, createDocumentId } from "@/lib/yjs";

interface CollaborativeMonacoEditorProps {
  workspaceId: string;
  filePath: string;
  fileName?: string;
  language?: string;
  initialValue?: string;
  theme?: "vs-dark" | "light";
  readOnly?: boolean;
  showPresenceCursors?: boolean;
}

const CollaborativeMonacoEditor = ({
  workspaceId,
  filePath,
  fileName,
  language = "plaintext",
  initialValue = "",
  theme = "vs-dark",
  readOnly = false,
  showPresenceCursors = true,
}: CollaborativeMonacoEditorProps) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [isBinding, setIsBinding] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced">("idle");
  
  const joinDocument = useCollaborationStore((state) => state.joinDocument);
  const leaveDocument = useCollaborationStore((state) => state.leaveDocument);
  const initializeDocument = useCollaborationStore((state) => state.initializeDocument);
  const status = useCollaborationStore((state) => state.status);
  const currentUser = useCollaborationStore((state) => state.currentUser);
  const isReadOnly = useCollaborationStore((state) => state.isReadOnly);
  const pendingChanges = useCollaborationStore((state) => state.pendingChanges);

  const documentId = createDocumentId(workspaceId, filePath);
  
  // Editor is read-only if explicitly set or if disconnected
  const effectiveReadOnly = readOnly || isReadOnly;

  useEffect(() => {
    // Initialize document with initial value
    if (initialValue && documentId) {
      initializeDocument(documentId, initialValue);
    }
  }, [documentId, initialValue, initializeDocument]);

  useEffect(() => {
    // Update editor read-only state dynamically
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly: effectiveReadOnly });
    }
  }, [effectiveReadOnly]);

  useEffect(() => {
    if (status === "connected" && documentId) {
      setSyncStatus("syncing");
      joinDocument(documentId).then(() => {
        setSyncStatus("synced");
        console.log(`[Editor] Joined document ${documentId}`);
      });

      return () => {
        leaveDocument(documentId);
        console.log(`[Editor] Left document ${documentId}`);
      };
    }
  }, [status, documentId, joinDocument, leaveDocument]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    if (isBinding) {
      return;
    }

    setIsBinding(true);

    try {
      const model = editor.getModel();
      if (!model) {
        console.error("[Editor] No model available");
        return;
      }

      // Create Monaco binding with Yjs
      const binding = createMonacoBinding(documentId, model, editor);
      console.log("[Editor] Monaco binding created successfully");

      // Set awareness state with user info
      if (currentUser && showPresenceCursors) {
        const awareness = getAwareness(documentId);
        awareness.setLocalStateField("user", {
          name: currentUser.name,
          color: currentUser.color,
          initials: currentUser.initials,
        });
      }

      // Configure undo manager
      editor.onDidChangeCursorPosition((e) => {
        if (showPresenceCursors && currentUser) {
          const awareness = getAwareness(documentId);
          awareness.setLocalStateField("cursor", {
            position: e.position,
            selection: editor.getSelection(),
          });
        }
      });

      // Enable undo/redo
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
        const doc = binding.doc;
        doc.transact(() => {
          // Undo is handled by MonacoBinding
        }, "undo");
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ, () => {
        const doc = binding.doc;
        doc.transact(() => {
          // Redo is handled by MonacoBinding
        }, "redo");
      });

    } catch (error) {
      console.error("[Editor] Failed to create binding:", error);
    } finally {
      setIsBinding(false);
    }
  };

  const syncStatusColor = 
    syncStatus === "synced" 
      ? "bg-green-500" 
      : syncStatus === "syncing" 
      ? "bg-yellow-400" 
      : "bg-gray-500";
  
  const statusText = isReadOnly && status === "disconnected" 
    ? "read-only (disconnected)" 
    : syncStatus;

  return (
    <div className="h-full w-full rounded-md overflow-hidden border border-gray-700 bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-300 bg-[#252526] border-b border-gray-800">
        <span className="font-mono">{fileName || filePath}</span>
        <div className="flex items-center gap-3">
          {isReadOnly && status === "disconnected" && (
            <span className="flex items-center gap-1.5 text-xs text-yellow-400">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Read-Only
            </span>
          )}
          {pendingChanges.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-orange-400" title={`${pendingChanges.length} unsaved changes`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {pendingChanges.length}
            </span>
          )}
          {status === "connected" && (
            <span className="flex items-center gap-1.5 text-xs">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${syncStatusColor}`} />
              {statusText}
            </span>
          )}
        </div>
      </div>
      <Editor
        height="100%"
        language={language}
        defaultValue={initialValue}
        theme={theme}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          readOnly: effectiveReadOnly,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </div>
  );
};

export default CollaborativeMonacoEditor;
