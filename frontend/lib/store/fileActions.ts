import { useAppStore } from "./index";

export interface FileState {
    isDirty: boolean;
    lastSavedAt: number | null;
    content?: string;
}

export interface FileActionsState {
    files: Record<string, FileState>;
    createFileAction: (workspaceId: string, path: string, content?: string) => Promise<void>;
    deleteFileAction: (workspaceId: string, fileId: string) => Promise<void>;
    renameFileAction: (workspaceId: string, oldFileId: string, newFileId: string) => Promise<void>;
    updateFileStatus: (fileId: string, status: Partial<FileState>) => void;
    markAsDirty: (fileId: string) => void;
}

export const useFileActions = (): FileActionsState => {
    const { fileTree, refreshFileTree, activeFileId, setActiveFileId, files } = useAppStore.getState();
    return {
        files,
        createFileAction: async (workspaceId: string, path: string, content: string = "") => {
            try {
                await fetch(`http://localhost:4001/workspaces/${workspaceId}/files/${encodeURIComponent(path)}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content }),
                });
                await refreshFileTree(workspaceId);
            } catch (error) {
                console.error("Failed to create file:", error);
                throw error;
            }
        },
        deleteFileAction: async (workspaceId: string, fileId: string) => {
            try {
                await fetch(`http://localhost:4001/workspaces/${workspaceId}/files/${encodeURIComponent(fileId)}`, {
                    method: "DELETE",
                });
                if (activeFileId === fileId) {
                    setActiveFileId(null);
                }
                await refreshFileTree(workspaceId);
            } catch (error) {
                console.error("Failed to delete file:", error);
                throw error;
            }
        },
        renameFileAction: async (workspaceId: string, oldFileId: string, newFileId: string) => {
            function fileTreeHasId(tree: any, id: string): boolean {
                if (!tree) return false;
                for (const node of tree) {
                    if (node.id === id) return true;
                    if (node.children && fileTreeHasId(node.children, id)) return true;
                }
                return false;
            }
            if (fileTree && fileTreeHasId(fileTree, newFileId)) {
                alert("A file with that name already exists.");
                throw new Error("Duplicate file path");
            }
            try {
                await fetch(`http://localhost:4001/workspaces/${workspaceId}/files/rename`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ oldFileId, newFileId }),
                });
                if (activeFileId === oldFileId) {
                    setActiveFileId(newFileId);
                }
                await refreshFileTree(workspaceId);
            } catch (error: any) {
                console.error("Failed to rename file:", error);
                alert("Rename failed: " + (error?.message || error));
                throw error;
            }
        },
        updateFileStatus: (fileId: string, status: Partial<FileState>) => {
            useAppStore.setState((state) => ({
                files: {
                    ...state.files,
                    [fileId]: {
                        ...(state.files[fileId] || { isDirty: false, lastSavedAt: null }),
                        ...status,
                    },
                },
            }));
        },
        markAsDirty: (fileId: string) => {
            const file = files[fileId];
            if (file?.isDirty) return;
            useAppStore.setState((state) => ({
                files: {
                    ...state.files,
                    [fileId]: {
                        ...(state.files[fileId] || { lastSavedAt: null }),
                        isDirty: true,
                    },
                },
            }));
        },
    };
};
