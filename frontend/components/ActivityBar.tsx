"use client";

import React from "react";
import { Files, Search, GitGraph, Play, Settings, User } from "lucide-react";

const ActivityBar = () => {
    return (
        <div className="w-12 bg-[#333333] flex flex-col items-center py-4 gap-6 border-r border-[#1e1e1e] z-20">
            <Files className="text-white cursor-pointer hover:text-blue-400 transition-colors" size={24} />
            <Search className="text-gray-500 hover:text-white cursor-pointer transition-colors" size={24} />
            <GitGraph className="text-gray-500 hover:text-white cursor-pointer transition-colors" size={24} />
            <Play className="text-gray-500 hover:text-white cursor-pointer transition-colors" size={24} />
            <div className="flex-grow" />
            <User className="text-gray-500 hover:text-white cursor-pointer transition-colors" size={24} />
            <Settings className="text-gray-500 hover:text-white cursor-pointer transition-colors" size={24} />
        </div>
    );
};

export default ActivityBar;
