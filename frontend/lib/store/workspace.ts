import { create } from "zustand";
import { saveFile as apiSaveFile } from "@/lib/api/files";
// import { toast } from "sonner";

interface FileState {
    isDirty: boolean;
    lastSavedAt: number | null;
}

interface WorkspaceState {
    files: Record<string, FileState>;
    activeFileId: string | null;

    // Actions
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

    setActiveFileId: (fileId) => set({ activeFileId: fileId }),

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
