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
            // This logic can be refined to check if 'welcome-file' exists or just pick the first file
            setActiveFileId('welcome-file');
        }
    }, [workspaceMetadata, setActiveFileId, activeFileId]);

    return { isLoading };
}
