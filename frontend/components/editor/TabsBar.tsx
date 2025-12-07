"use client";

import type { FileEntity } from "@/types/editor";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { KeyboardEvent } from "react";

interface TabsBarProps {
  tabs: FileEntity[];
  activeTabId: string | null;
  onSelect: (tabId: string) => void;
  onClose: (tabId: string) => void;
}

const TabsBar = ({ tabs, activeTabId, onSelect, onClose }: TabsBarProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, tabId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(tabId);
    }
  };

  const renderTabs = () => {
    if (tabs.length === 0) {
      return (
        <div className="flex h-full min-w-40 items-center justify-center rounded-t px-4 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-gray-500/80">
          Loading file...
        </div>
      );
    }

    return tabs.map((tab) => {
      const isActive = tab.id === activeTabId;
      return (
        <div
          key={tab.id}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(tab.id)}
          onKeyDown={(event) => handleKeyDown(event, tab.id)}
          className={cn(
            "group flex h-full min-w-[140px] max-w-60 items-center justify-between rounded-t px-3 py-1 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 cursor-pointer",
            isActive
              ? "bg-[#2a2d2e] text-white shadow-[inset_0_-2px_0_0_rgba(99,179,237,0.7)]"
              : "bg-[#1f1f22] text-gray-400 hover:bg-[#252526] hover:text-gray-100"
          )}
          title={tab.path}
        >
          <span className="flex flex-1 items-center truncate font-medium leading-none">
            {tab.name}
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onClose(tab.id);
            }}
            className="ml-1 flex items-center justify-center rounded-sm p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
            aria-label={`Close ${tab.name}`}
          >
            <X size={14} />
          </button>
        </div>
      );
    });
  };

  return (
    <div className="flex h-full min-w-0 items-stretch gap-0.5 overflow-x-auto bg-[#151518] px-1">
      {renderTabs()}
    </div>
  );
};

export default TabsBar;
