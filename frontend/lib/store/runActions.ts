import { useAppStore } from "./index";
import type { FileState } from "./fileActions";

export interface RunActionsState {
    isRunning: boolean;
    setIsRunning: (isRunning: boolean) => void;
    forceSaveAll: (workspaceId: string) => Promise<boolean>;
}

export const useRunActions = (): RunActionsState => {
    const { isRunning, files, saveFile } = useAppStore.getState();
    return {
        isRunning,
        setIsRunning: (running: boolean) => {
            if (running && isRunning) {
                alert("A run is already in progress.");
                return;
            }
            useAppStore.setState({ isRunning: running });
        },
        forceSaveAll: async (workspaceId: string) => {
            const dirtyFiles = Object.entries(files).filter(([_, state]) => (state as FileState).isDirty);
            if (dirtyFiles.length === 0) return true;
            try {
                for (const [fileId, state] of dirtyFiles) {
                    if ((state as FileState).content === undefined) {
                        console.warn(`File ${fileId} is dirty but has no content in store. Skipping save.`);
                        continue;
                    }
                    const success = await saveFile(workspaceId, fileId, (state as FileState).content!);
                    if (!success) {
                        alert(`Failed to save file: ${fileId}`);
                        return false;
                    }
                }
                return true;
            } catch (error: any) {
                console.error("Force save failed:", error);
                alert("Force save failed: " + (error?.message || error));
                return false;
            }
        },
    };
};
