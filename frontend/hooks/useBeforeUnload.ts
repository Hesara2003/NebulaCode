import { useEffect } from "react";
import { useWorkspaceStore } from "@/lib/store/workspace";

const SNAPSHOT_KEY_PREFIX = "nebula_snapshot_";

export function getSnapshotKey(workspaceId: string) {
    return `${SNAPSHOT_KEY_PREFIX}${workspaceId}`;
}

interface FileSnapshot {
    fileId: string;
    content: string;
    timestamp: number;
}

export function useBeforeUnload(workspaceId: string) {
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!workspaceId) return;

            const state = useWorkspaceStore.getState();
            // Check for dirty files
            const dirtyFiles = Object.entries(state.files).filter(([_, file]) => file.isDirty);

            if (dirtyFiles.length > 0) {
                // 1. Emergency Snapshot to localStorage
                const snapshots: Record<string, FileSnapshot> = {};

                dirtyFiles.forEach(([fileId, file]) => {
                    if (file.content !== undefined) {
                        snapshots[fileId] = {
                            fileId,
                            content: file.content,
                            timestamp: Date.now(),
                        };
                    }
                });

                if (Object.keys(snapshots).length > 0) {
                    try {
                        localStorage.setItem(getSnapshotKey(workspaceId), JSON.stringify(snapshots));
                    } catch (err) {
                        console.error("Failed to save emergency snapshot:", err);
                    }
                }

                // 2. Attempt Best-Effort Force Save
                // We trigger this but cannot await it in beforeunload
                state.forceSaveAll(workspaceId).catch(err =>
                    console.error("Emergency save failed:", err)
                );

                // 3. Trigger Browser Confirmation
                e.preventDefault();
                e.returnValue = ""; // Required for Chrome
                return "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [workspaceId]);
}
