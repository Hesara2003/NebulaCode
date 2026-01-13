import React from "react";
import { File, Folder, ChevronRight, ChevronDown } from "lucide-react";
import FileExplorer from "./FileExplorer";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeFileId?: string | null;
  onOpenFile?: (fileId: string) => void;
}

const explorerFiles = [
  { id: "welcome.ts", label: "welcome.ts", accent: "text-yellow-400" },
  { id: "server.ts", label: "server.ts", accent: "text-red-400" },
  { id: "runner.py", label: "runner.py", accent: "text-green-400" },
  { id: "README.md", label: "README.md", accent: "text-blue-400" },
];

const Sidebar = ({ activeFileId, onOpenFile }: SidebarProps) => {
  return (
    <div className="flex w-64 flex-col select-none border-r border-[#1e1e1e] bg-[#252526] text-gray-400">
      <div className="p-3 text-xs font-bold uppercase tracking-wider mb-1 flex justify-between items-center">
        <span>Explorer</span>
        <span className="text-[10px] cursor-pointer hover:text-white">...</span>
      </div>

      <div className="flex flex-col gap-0 overflow-y-auto grow">
        {/* Project Root */}
        <div className="flex items-center gap-1 px-2 py-1 text-gray-300 font-bold hover:bg-[#2a2d2e] cursor-pointer">
          <ChevronDown size={16} />
          <span className="text-sm">NEBULACODE</span>
        </div>

        {/* Files */}
        <div className="flex flex-col">
          {explorerFiles.map((file) => {
            const isActive = file.id === activeFileId;
            return (
              <button
                key={file.id}
                type="button"
                onClick={() => onOpenFile?.(file.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-1 text-left text-sm transition",
                  isActive
                    ? "bg-[#37373d] text-white border-l-2 border-blue-500"
                    : "text-gray-300 hover:bg-[#2a2d2e]"
                )}
              >
                <File size={14} className={file.accent} />
                <span>{file.label}</span>
              </button>
            );
          })}
        </div>

        {/* Optional: keep FileExplorer for later use */}
        {/* <FileExplorer /> */}
      </div>
    </div>
  );
};

export default Sidebar;
