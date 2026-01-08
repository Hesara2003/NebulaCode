import React from "react";
import { File, Folder, ChevronRight, ChevronDown } from "lucide-react";
import FileExplorer from "./FileExplorer";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeFileId?: string | null;
  onOpenFile?: (fileId: string) => void;
}

const explorerFiles = [
  { id: "welcome-file", label: "welcome.ts", accent: "text-yellow-400" },
  { id: "api-file", label: "server.ts", accent: "text-red-400" },
  { id: "python-file", label: "runner.py", accent: "text-green-400" },
  { id: "readme-file", label: "README.md", accent: "text-blue-400" },
];

const Sidebar = ({ activeFileId, onOpenFile }: SidebarProps) => {
  return (
    <div className="flex w-64 flex-col select-none border-r border-[#1e1e1e] bg-[#252526] text-gray-400">
      <div className="p-3 text-xs font-bold uppercase tracking-wider mb-1 flex justify-between items-center">
        <span>Explorer</span>
        <span className="text-[10px] cursor-pointer hover:text-white">...</span>
      </div>

      <div className="flex flex-col gap-0 overflow-y-auto flex-grow">
        {/* Project Root */}
        <div className="flex items-center gap-1 px-2 py-1 text-gray-300 font-bold hover:bg-[#2a2d2e] cursor-pointer">
          <ChevronDown size={16} />
          <span className="text-sm">NEBULACODE</span>
        </div>

        <FileExplorer
          workspaceId="demo-workspace"
          activeFileId={activeFileId}
          onOpenFile={onOpenFile}
        />
      </div>
    </div>
  );
};

export default Sidebar;
