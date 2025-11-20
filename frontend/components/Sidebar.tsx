import React from 'react';
import { File, Folder, ChevronRight, ChevronDown } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="w-64 bg-[#252526] border-r border-[#1e1e1e] flex flex-col text-gray-400 select-none">
      <div className="p-3 text-xs font-bold uppercase tracking-wider mb-1 flex justify-between items-center">
        <span>Explorer</span>
        <span className="text-[10px] cursor-pointer hover:text-white">...</span>
      </div>
      
      <div className="flex flex-col gap-0">
        {/* Project Root */}
        <div className="flex items-center gap-1 px-2 py-1 hover:bg-[#2a2d2e] cursor-pointer text-gray-300 font-bold">
            <ChevronDown size={16} />
            <span className="text-sm">NEBULACODE</span>
        </div>

        {/* Files */}
        <div className="flex flex-col">
            <div className="flex items-center gap-2 px-6 py-1 hover:bg-[#2a2d2e] cursor-pointer bg-[#37373d] text-white border-l-2 border-blue-500">
                <File size={14} className="text-yellow-400" />
                <span className="text-sm">main.js</span>
            </div>
            <div className="flex items-center gap-2 px-6 py-1 hover:bg-[#2a2d2e] cursor-pointer">
                <File size={14} className="text-red-400" />
                <span className="text-sm">package.json</span>
            </div>
            <div className="flex items-center gap-2 px-6 py-1 hover:bg-[#2a2d2e] cursor-pointer">
                <File size={14} className="text-blue-400" />
                <span className="text-sm">README.md</span>
            </div>
            <div className="flex items-center gap-2 px-6 py-1 hover:bg-[#2a2d2e] cursor-pointer">
                <File size={14} className="text-gray-400" />
                <span className="text-sm">.gitignore</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
