import React from 'react';
import { File, Folder, ChevronRight, ChevronDown } from 'lucide-react';
import FileExplorer from './FileExplorer';

const Sidebar = () => {
  return (
    <div className="w-64 bg-[#252526] border-r border-[#1e1e1e] flex flex-col text-gray-400 select-none">
      <div className="p-3 text-xs font-bold uppercase tracking-wider mb-1 flex justify-between items-center">
        <span>Explorer</span>
        <span className="text-[10px] cursor-pointer hover:text-white">...</span>
      </div>

      <div className="flex flex-col gap-0 overflow-y-auto flex-grow">
        {/* Project Root */}
        <div className="flex items-center gap-1 px-2 py-1 hover:bg-[#2a2d2e] cursor-pointer text-gray-300 font-bold">
          <ChevronDown size={16} />
          <span className="text-sm">NEBULACODE</span>
        </div>

        {/* Files */}
        <FileExplorer />
      </div>
    </div>
  );
};

export default Sidebar;
