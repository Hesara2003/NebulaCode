"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import MonacoEditor, { OnMount } from "@monaco-editor/react";
import { Loader2, Play } from "lucide-react";
import { getFile } from "@/lib/api/files";
import { createRun } from "@/lib/api/run";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { Button } from "@/components/ui/button";

interface EditorPaneProps {
    workspaceId: string;
    fileId: string | null;
    onRunStart?: (runId: string) => void;
}

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
    let timeout: NodeJS.Timeout;
    return function (...args: Parameters<T>) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export default function EditorPane({
    workspaceId,
    fileId,
    onRunStart,
}: EditorPaneProps) {
    const [content, setContent] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const {
        saveFile,
        updateFileStatus,
        files,
        setActiveFileId,
        isRunning,
        setIsRunning,
        forceSaveAll
    } = useWorkspaceStore();

    const fileState = fileId ? files[fileId] : null;
    const isDirty = fileState?.isDirty || false;

    // Refs for auto-save logic to avoid closure staleness
    const contentRef = useRef(content);
    const fileIdRef = useRef(fileId);

    // Sync refs
    useEffect(() => {
        contentRef.current = content;
        fileIdRef.current = fileId;
    }, [content, fileId]);

    // Sync activeFileId with store
    useEffect(() => {
        setActiveFileId(fileId);
    }, [fileId, setActiveFileId]);

    // Debounced save function
    const performAutoSave = useCallback(
        debounce(async (wId: string, fId: string, c: string) => {
            setSaving(true);
            try {
                await saveFile(wId, fId, c);
            } finally {
                setSaving(false);
            }
        }, 1000),
        [saveFile]
    );

    // Load file content
    useEffect(() => {
        if (!fileId) {
            setContent("");
            return;
        }

        // Check if we have unsaved/restored content in store first
        const state = useWorkspaceStore.getState();
        const storedFile = state.files[fileId];

        if (storedFile?.isDirty && storedFile.content !== undefined) {
            console.log("Loading restored/unsaved content for:", fileId);
            setContent(storedFile.content);
            setLoading(false);
        } else {
            const fetchFile = async () => {
                setLoading(true);
                try {
                    const file = await getFile(workspaceId, fileId);
                    setContent(file.content || "");
                } catch (err) {
                    console.error("Failed to load file:", err);
                    setContent("// Failed to load file content");
                } finally {
                    setLoading(false);
                }
            };

            fetchFile();
        }

        return () => {
            // Cleanup: If the CURRENT fileId (before switch) is dirty, save it immediately.
            const currentRefFileId = fileIdRef.current;
            const currentRefContent = contentRef.current;
            if (currentRefFileId && currentRefContent) {
                const state = useWorkspaceStore.getState();
                if (state.files[currentRefFileId]?.isDirty) {
                    console.log("Saving on file switch/unmount:", currentRefFileId);
                    state.saveFile(workspaceId, currentRefFileId, currentRefContent);
                }
            }
        };
    }, [fileId, workspaceId]);

    const handleContentChange = (value: string | undefined) => {
        const newContent = value || "";
        setContent(newContent);

        if (fileId) {
            // Update store with latest content and dirty status immediately
            // This ensures forceSaveAll has the correct content
            updateFileStatus(fileId, { isDirty: true, content: newContent });

            performAutoSave(workspaceId, fileId, newContent);
        }
    };

    const handleRun = async () => {
        if (!fileId || isRunning) return;

        setIsRunning(true);
        setSaving(true); // UI feedback

        try {
            // 1. Force save all dirty files (ensure backend is fresh)
            // Note: forceSaveAll handles the save logic using content stored in the store
            // We ensure store has latest content via handleContentChange
            const saveSuccess = await forceSaveAll(workspaceId);

            if (!saveSuccess) {
                // Determine if we should abort. The requirement says:
                // "If it fails -> show error toast, abort run, set isRunning = false"
                console.error("Save failed, aborting run");
                alert("Failed to save files. Run aborted."); // Simple feedback for now
                setIsRunning(false);
                setSaving(false);
                return;
            }

            setSaving(false); // Saves done, moving to run

            // 2. Trigger run
            const response = await createRun({
                workspaceId,
                fileId,
                language: "python", // Infer or hardcode for now
            });
            if (onRunStart) {
                onRunStart(response.runId);
            }
        } catch (error) {
            console.error("Failed to start run:", error);
            setIsRunning(false);
        } finally {
            // Note: We keep isRunning true if run started successfully?
            // Req: "When execution completes or errors -> set isRunning = false"
            // Since `createRun` is likely just triggering the run (async on backend?), 
            // we might want to reset `isRunning` here if the UI doesn't track the actual run process longer.
            // But let's assume `createRun` returns quickly.
            // If `createRun` is the trigger, and execution happens via WebSocket or polling, 
            // we should probably reset `isRunning` here UNLESS we have a way to track the run status globally.
            // "When execution completes or errors -> set isRunning = false"
            // If our `createRun` is fire-and-forget, we reset here.
            setIsRunning(false);
        }
    };

    if (!fileId) {
        return (
            <div className="flex h-full w-full items-center justify-center text-gray-500 bg-[#1e1e1e]">
                Select a file to edit
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-[#1e1e1e]">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-[#333]">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">{fileId}</span>
                    {isDirty && (
                        <span className="text-lg text-white ml-1" title="Unsaved changes">&#9679;</span>
                    )}
                    {saving && <span className="text-xs text-gray-500 animate-pulse">Saving...</span>}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-green-400 hover:text-green-300 hover:bg-[#333]"
                        disabled={isRunning}
                    >
                        {isRunning ? (
                            <>
                                <Loader2 size={14} className="mr-1 animate-spin" /> {saving ? "Saving..." : "Running..."}
                            </>
                        ) : (
                            <>
                                <Play size={14} className="mr-1" /> Run
                            </>
                        )}
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-blue-400 hover:text-blue-300 hover:bg-[#333]"
                        onClick={() => {
                            if (fileId) {
                                import("@/lib/api/files").then(mod => mod.downloadFile(workspaceId, fileId));
                            }
                        }}
                    >
                        Download
                    </Button>
                </div>
            </div>

            <div className="grow overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1e1e1e]/50 backdrop-blur-sm">
                        <Loader2 className="animate-spin text-white" />
                    </div>
                )}
                <MonacoEditor
                    height="100%"
                    language={fileId.endsWith(".py") ? "python" : "typescript"} // Simple detection
                    theme="vs-dark"
                    value={content}
                    onChange={handleContentChange}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        padding: { top: 16 },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                    }}
                />
            </div>
        </div >
    );
}
