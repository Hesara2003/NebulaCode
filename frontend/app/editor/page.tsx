"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ActivityBar from "@/components/ActivityBar";
import EditorPane from "@/components/editor/EditorPane";
import dynamic from "next/dynamic";
import { useWorkspaceStore } from "@/lib/store/workspace";

const TerminalComponent = dynamic(() => import("@/components/TerminalComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#1e1e1e] flex items-center justify-center text-gray-500">
      Loading terminal...
    </div>
  ),
});

import { useWorkspaceRestore } from "@/hooks/useWorkspaceRestore";
import { Loader2 } from "lucide-react";

export default function Home() {
  const workspaceId = "demo-workspace";
  const { isLoading } = useWorkspaceRestore(workspaceId);

  // We rely on the store for the active file now, but for local UI state 
  // we might still need to sync or just read from store directly in EditorPane.
  // However, the existing code uses local state `activeFileId`. 
  // We should probably sync this local state with the store's state.

  // Actually, let's read activeFileId from store if possible, or keep local state in sync.
  // For this step, let's keep the local state but initialize it via effect if needed, 
  // OR better: let's modify Home to use the store's activeFileId.

  // BUT `useWorkspaceRestore` sets the store. `Home` uses `useState`.
  // Let's refactor `Home` to use the store for `activeFileId` to be consistent.

  const { activeFileId, setActiveFileId } = useWorkspaceStore();

  const [runId, setRunId] = useState<string>("demo-run"); // Managed state
  const wsToken = process.env.NEXT_PUBLIC_WS_TOKEN ?? "devtoken";

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#1e1e1e] flex items-center justify-center text-white">
        <Loader2 className="animate-spin mr-2" /> Restoring workspace...
      </div>
    )
  }

  const handleOpenFile = (fileId: string) => {
    setActiveFileId(fileId);
  };

  const handleActiveFileChange = (fileId: string | null) => {
    setActiveFileId(fileId);
  };

  const handleRunStart = (newRunId: string) => {
    setRunId(newRunId);
  };

  return (
    <main className="flex h-screen w-screen bg-[#1e1e1e] text-white overflow-hidden">
      {/* Activity Bar (Leftmost) */}
      <ActivityBar />

      {/* Sidebar (Explorer) */}
      <Sidebar activeFileId={activeFileId} onOpenFile={handleOpenFile} />

      {/* Main Content Area */}
      <div className="flex flex-col grow h-full">
        <div className="relative grow bg-[#1e1e1e]">
          <EditorPane
            workspaceId="demo-workspace"
            fileId={activeFileId}
            onActiveFileChange={handleActiveFileChange}
            onRunStart={handleRunStart}
          />
        </div>

        {/* Bottom Panel (Terminal) */}
        <div className="h-48 border-t border-[#333] bg-[#1e1e1e] flex flex-col">
          <div className="flex items-center px-4 h-8 bg-[#1e1e1e] border-b border-[#333] gap-6 text-xs uppercase tracking-wide text-gray-400">
            <span className="text-white border-b border-white h-full flex items-center cursor-pointer">Terminal</span>
            <span className="hover:text-white cursor-pointer h-full flex items-center">Output</span>
            <span className="hover:text-white cursor-pointer h-full flex items-center">Debug Console</span>
            <span className="hover:text-white cursor-pointer h-full flex items-center">Problems</span>
          </div>
          <div className="grow overflow-hidden">
            <TerminalComponent runId={runId} token={wsToken} />
          </div>
        </div>

      </div>
    </main>
  );
}
