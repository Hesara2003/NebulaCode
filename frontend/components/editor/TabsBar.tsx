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
        <div className="flex h-full items-center px-4 text-xs uppercase tracking-[0.3em] text-gray-500">
          Loading file...
        </div>
      );
    }

    return tabs.map((tab) => {
      const isActive = tab.id === activeTabId;
      return (
        <div
          key={tab.id}
          role="tab"
          aria-selected={isActive}
          tabIndex={0}
          onClick={() => onSelect(tab.id)}
          onKeyDown={(event) => handleKeyDown(event, tab.id)}
          className={cn(
            "group flex h-full min-w-[140px] max-w-[220px] items-center gap-2 border-r border-[#1e1e1e] px-4 text-sm transition",
            isActive
              ? "bg-[#1e1e1e] text-white"
              : "bg-[#2d2d2d] text-gray-400 hover:bg-[#252526] hover:text-white"
          )}
          title={tab.path}
        >
          <span className="truncate font-medium">{tab.name}</span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onClose(tab.id);
            }}
            className="rounded p-0.5 text-gray-400 transition hover:bg-white/10 hover:text-white"
            aria-label={`Close ${tab.name}`}
          >
            <X size={14} />
          </button>
        </div>
      );
    });
  };

  return (
    <div className="flex h-full min-w-0 items-stretch overflow-x-auto" role="tablist">
      {renderTabs()}
    </div>
  );
};

export default TabsBar;
