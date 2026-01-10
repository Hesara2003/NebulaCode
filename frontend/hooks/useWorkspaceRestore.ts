import { useEffect } from "react";
import { useWorkspaceStore } from "@/lib/store/workspace";
import { Loader2 } from "lucide-react";

export function useWorkspaceRestore(workspaceId: string) {
    const { fetchWorkspace, workspaceMetadata, isLoading, setActiveFileId, activeFileId } = useWorkspaceStore();

    useEffect(() => {
        if (!workspaceId) return;

        // 1. Fetch metadata (which includes lastActiveFile)
        fetchWorkspace(workspaceId);
    }, [workspaceId, fetchWorkspace]);

    useEffect(() => {
        // 2. Once metadata is loaded, restore the active file
        if (workspaceMetadata?.lastActiveFile && !activeFileId) {
            setActiveFileId(workspaceMetadata.lastActiveFile);
        } else if (workspaceMetadata && !workspaceMetadata.lastActiveFile && !activeFileId) {
            // Fallback to a default file if no last active file is set
            setActiveFileId('welcome-file');
        }
    }, [workspaceMetadata, setActiveFileId, activeFileId]);

    // 3. Check for emergency snapshots
    const { updateFileStatus } = useWorkspaceStore();
    useEffect(() => {
        if (!workspaceId) return;

        try {
            const key = `nebula_snapshot_${workspaceId}`;
            const snapshotStr = localStorage.getItem(key);

            if (snapshotStr) {
                const snapshots = JSON.parse(snapshotStr);
                const fileIds = Object.keys(snapshots);

                if (fileIds.length > 0) {
                    // We found a snapshot. In a real app, we might compare timestamps if backend provided them.
                    // Here we rely on the user to decide.
                    const shouldRestore = window.confirm(
                        "Unsaved changes were found from a previous session. Restore?"
                    );

                    if (shouldRestore) {
                        fileIds.forEach((fId) => {
                            const snap = snapshots[fId];
                            // Restore content and mark as dirty so user knows it's unsaved
                            updateFileStatus(fId, {
                                content: snap.content,
                                isDirty: true,
                            });
                        });
                        // We don't clear the snapshot immediately after restore?
                        // Requirement 4: "After restore decision: Clear snapshot to avoid repeated prompts."
                        // But if we clear it, and the user refreshes AGAIN before saving, data is lost.
                        // However, the requirement says "After restore decision: Clear snapshot".
                        // Logic: Once restored, it's in memory (dirty). If they refresh again, `useBeforeUnload` 
                        // should trigger and save a NEW snapshot.
                        // So correct: clear it now.
                        localStorage.removeItem(key);
                    } else {
                        // User declined, discard snapshot
                        localStorage.removeItem(key);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to restore snapshot:", e);
        }
    }, [workspaceId, updateFileStatus]);

    return { isLoading };
}
