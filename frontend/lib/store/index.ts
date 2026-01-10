import { create } from "zustand";
import { WorkspaceStoreState, useWorkspaceStore } from "./workspaceStore";
import { FileActionsState, useFileActions } from "./fileActions";
import { RunActionsState, useRunActions } from "./runActions";

export type AppStoreState = WorkspaceStoreState & FileActionsState & RunActionsState;

export const useAppStore = create<AppStoreState>((set, get) => ({
  ...useWorkspaceStore.getState(),
  ...useFileActions(),
  ...useRunActions(),
}));
