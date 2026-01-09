import { create } from "zustand";
import { saveFile as apiSaveFile } from "@/lib/api/files";
import { FileNode } from "@/types/editor";
// import { toast } from "sonner";

interface FileState {
    isDirty: boolean;
    lastSavedAt: number | null;
}

interface WorkspaceState {
    files: Record<string, FileState>;
    activeFileId: string | null;
    workspaceMetadata: { id: string; name: string; lastActiveFile?: string } | null;
    isLoading: boolean;
    fileTree: FileNode[];

    // Actions
    fetchWorkspace: (id: string) => Promise<void>;
    refreshFileTree: (workspaceId: string) => Promise<void>;
    createFileAction: (workspaceId: string, path: string, content?: string) => Promise<void>;
    deleteFileAction: (workspaceId: string, fileId: string) => Promise<void>;
    renameFileAction: (workspaceId: string, oldFileId: string, newFileId: string) => Promise<void>;
    setLastActiveFile: (fileId: string) => void;
    setActiveFileId: (fileId: string | null) => void;
    updateFileStatus: (fileId: string, status: Partial<FileState>) => void;
    markAsDirty: (fileId: string) => void;

    /**
     * Saves the file content to the backend.
     * Updates state to { isDirty: false, lastSavedAt: now } on success.
     */
    saveFile: (workspaceId: string, fileId: string, content: string) => Promise<boolean>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
    files: {},
    activeFileId: null,
    workspaceMetadata: null,
    isLoading: false,
    fileTree: [],

    fetchWorkspace: async (id) => {
        set({ isLoading: true });
        try {
            const res = await fetch(`http://localhost:4001/workspaces/${id}`);
            if (!res.ok) throw new Error("Failed to fetch workspace");
            const data = await res.json();
            set({ workspaceMetadata: data });
            await get().refreshFileTree(id);
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

    createFileAction: async (workspaceId, path, content = "") => {
        try {
            // Backend treats path as ID currently in simple mock, 
            // but controller expects :workspaceId/files/:fileId
            // and POST body { content }.
            // We need to support nested paths ideally.
            // For now assuming path acts as fileId.
            await fetch(`http://localhost:4001/workspaces/${workspaceId}/files/${encodeURIComponent(path)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });
            await get().refreshFileTree(workspaceId);
        } catch (error) {
            console.error("Failed to create file:", error);
            throw error;
        }
    },

    deleteFileAction: async (workspaceId, fileId) => {
        try {
            await fetch(`http://localhost:4001/workspaces/${workspaceId}/files/${encodeURIComponent(fileId)}`, {
                method: "DELETE",
            });

            const { activeFileId } = get();
            if (activeFileId === fileId) {
                get().setActiveFileId(null);
            }

            await get().refreshFileTree(workspaceId);
        } catch (error) {
            console.error("Failed to delete file:", error);
            throw error;
        }
    },

    renameFileAction: async (workspaceId, oldFileId, newFileId) => {
        try {
            await fetch(`http://localhost:4001/workspaces/${workspaceId}/files/rename`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oldFileId, newFileId }),
            });

            const { activeFileId } = get();
            if (activeFileId === oldFileId) {
                get().setActiveFileId(newFileId);
            }

            await get().refreshFileTree(workspaceId);
        } catch (error) {
            console.error("Failed to rename file:", error);
            throw error;
        }
    },

    setLastActiveFile: async (fileId) => {
        const { workspaceMetadata } = get();
        if (!workspaceMetadata) return;

        // Optimistic update
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

    setActiveFileId: (fileId) => {
        set({ activeFileId: fileId });
        if (fileId) {
            get().setLastActiveFile(fileId);
        }
    },

    updateFileStatus: (fileId, status) => {
        set((state) => ({
            files: {
                ...state.files,
                [fileId]: {
                    ...(state.files[fileId] || { isDirty: false, lastSavedAt: null }),
                    ...status,
                },
            },
        }));
    },

    markAsDirty: (fileId) => {
        const file = get().files[fileId];
        if (file?.isDirty) return; // Already dirty, no-op

        set((state) => ({
            files: {
                ...state.files,
                [fileId]: {
                    ...(state.files[fileId] || { lastSavedAt: null }),
                    isDirty: true,
                },
            },
        }));
    },

    saveFile: async (workspaceId, fileId, content) => {
        try {
            await apiSaveFile(workspaceId, fileId, content);

            set((state) => ({
                files: {
                    ...state.files,
                    [fileId]: {
                        ...state.files[fileId],
                        isDirty: false,
                        lastSavedAt: Date.now(),
                    },
                },
            }));

            return true;
        } catch (error) {
            console.error("Failed to auto-save:", error);
            // Keep isDirty = true
            return false;
        }
    },
}));
