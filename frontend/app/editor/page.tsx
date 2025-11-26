"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ActivityBar from "@/components/ActivityBar";
import TerminalComponent from "@/components/TerminalComponent";
import EditorPane from "@/components/editor/EditorPane";

export default function Home() {
  const [activeFileId, setActiveFileId] = useState<string | null>("welcome-file");

  const handleOpenFile = (fileId: string) => {
    setActiveFileId(fileId);
  };

  const handleActiveFileChange = (fileId: string | null) => {
    setActiveFileId(fileId);
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
                <TerminalComponent />
            </div>
        </div>

      </div>
    </main>
  );
}
