import { create } from "zustand";
import { FileNode } from "@/types/editor";

export interface WorkspaceMetadata {
    id: string;
    name: string;
    lastActiveFile?: string;
}

export interface WorkspaceStoreState {
    workspaceMetadata: WorkspaceMetadata | null;
    activeFileId: string | null;
    fileTree: FileNode[];
    isLoading: boolean;
    files: Record<string, import('./fileActions').FileState>;
    isRunning: boolean;
    saveFile: (workspaceId: string, fileId: string, content: string) => Promise<boolean>;
    fetchWorkspace: (id: string) => Promise<void>;
    refreshFileTree: (workspaceId: string) => Promise<void>;
    setActiveFileId: (fileId: string | null) => void;
    setLastActiveFile: (fileId: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStoreState>((set, get) => ({
    workspaceMetadata: null,
    activeFileId: null,
    fileTree: [],
    isLoading: false,
    files: {},
    isRunning: false,
    saveFile: async (workspaceId, fileId, content) => {
        try {
            // Replace with your actual save logic
            // e.g. await apiSaveFile(workspaceId, fileId, content);
            set((state) => ({
                files: {
                    ...state.files,
                    [fileId]: {
                        ...state.files[fileId],
                        isDirty: false,
                        lastSavedAt: Date.now(),
                        content: content,
                    },
                },
            }));
            return true;
        } catch (error) {
            console.error("Failed to save file:", error);
            return false;
        }
    },
    fetchWorkspace: async (id) => {
        set({ isLoading: true });
        try {
            const res = await fetch(`http://localhost:4001/workspaces/${id}`);
            if (!res.ok) throw new Error("Failed to fetch workspace");
            const data = await res.json();
            set({ workspaceMetadata: data });
            await get().refreshFileTree(id);
            if (data.lastActiveFile) {
                set({ activeFileId: data.lastActiveFile });
            } else {
                set({ activeFileId: null });
            }
        } catch (error) {
            console.error("Fetch workspace error:", error);
        } finally {
            set({ isLoading: false });
        }
    },
    refreshFileTree: async (workspaceId) => {
        try {
            const res = await fetch(`http://localhost:4001/workspaces/${workspaceId}/files`);
            if (!res.ok) throw new Error("Failed to fetch file tree");
            const tree = await res.json();
            set({ fileTree: tree });
        } catch (error) {
            console.error("Failed to refresh file tree:", error);
        }
    },
    setActiveFileId: (fileId) => {
        set({ activeFileId: fileId });
        if (fileId) {
            get().setLastActiveFile(fileId);
        }
    },
    setLastActiveFile: async (fileId) => {
        const { workspaceMetadata } = get();
        if (!workspaceMetadata) return;
        set({ workspaceMetadata: { ...workspaceMetadata, lastActiveFile: fileId } });
        try {
            await fetch(`http://localhost:4001/workspaces/${workspaceMetadata.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lastActiveFile: fileId }),
            });
        } catch (error) {
            console.error("Failed to update lastActiveFile:", error);
        }
    },
}));
