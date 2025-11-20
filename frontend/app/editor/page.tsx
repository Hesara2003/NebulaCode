"use client";

import CodeEditor from "@/components/CodeEditor";
import Sidebar from "@/components/Sidebar";
import ActivityBar from "@/components/ActivityBar";
import TerminalComponent from "@/components/TerminalComponent";
import { Play, Share2, Download } from "lucide-react";

export default function Home() {
  return (
    <main className="flex h-screen w-screen bg-[#1e1e1e] text-white overflow-hidden">
      {/* Activity Bar (Leftmost) */}
      <ActivityBar />

      {/* Sidebar (Explorer) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-grow h-full">
        
        {/* Top Bar / Tabs */}
        <div className="h-10 bg-[#1e1e1e] flex items-center border-b border-[#1e1e1e]">
            <div className="flex h-full">
                <div className="px-4 flex items-center gap-2 bg-[#1e1e1e] border-t-2 border-blue-500 text-sm text-white min-w-[120px] justify-between">
                    <span>main.js</span>
                    <span className="hover:bg-gray-700 rounded-full p-0.5 cursor-pointer">×</span>
                </div>
                <div className="px-4 flex items-center gap-2 bg-[#2d2d2d] text-sm text-gray-400 min-w-[120px] border-r border-[#1e1e1e] cursor-pointer hover:bg-[#252526]">
                    <span>package.json</span>
                </div>
            </div>
            <div className="flex-grow bg-[#252526] h-full flex items-center justify-end px-4 gap-3">
                 <button className="flex items-center gap-2 px-3 py-1 bg-green-700 hover:bg-green-600 rounded text-xs font-medium transition-colors">
                    <Play size={14} /> Run
                </button>
                <button className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium transition-colors">
                    <Share2 size={14} /> Share
                </button>
            </div>
        </div>

        {/* Editor Area */}
        <div className="flex-grow relative bg-[#1e1e1e]">
             <CodeEditor 
                language="javascript"
                theme="vs-dark"
                defaultValue={`// Welcome to NebulaCode
// Start writing your code here...

function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("Developer"));
`}
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
            <div className="flex-grow overflow-hidden">
                <TerminalComponent />
            </div>
        </div>

      </div>
    </main>
  );
}
