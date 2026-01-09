"use client";

import React, { useEffect, useState } from 'react';
import { File, Folder, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import axios from 'axios';
import { cn } from "@/lib/utils";

interface FileNode {
    id: string;
    name: string;
    type: 'file' | 'folder';
    children?: FileNode[];
}

interface FileExplorerProps {
    workspaceId: string;
    activeFileId?: string | null;
    onOpenFile?: (fileId: string) => void;
}

const FileTreeItem = ({ node, depth, activeFileId, onOpenFile }: { node: FileNode; depth: number; activeFileId?: string | null; onOpenFile?: (id: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => {
        if (node.type === 'folder') {
            setIsOpen(!isOpen);
        } else {
            onOpenFile?.(node.id);
        }
    };

    const isActive = node.id === activeFileId;

    return (
        <div>
            <div
                className={cn(
                    "flex items-center gap-1 py-1 cursor-pointer select-none transition-colors",
                    isActive ? "bg-[#37373d] text-white" : "text-gray-300 hover:bg-[#2a2d2e]"
                )}
                style={{ paddingLeft: `${depth * 12 + 12}px` }}
                onClick={toggleOpen}
            >
                {node.type === 'folder' && (
                    isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                )}
                {node.type === 'file' && <File size={14} className="ml-4 text-blue-400" />}
                {node.type === 'folder' && <Folder size={14} className="text-yellow-400" />}

                <span className="text-sm ml-1">{node.name}</span>
            </div>
            {isOpen && node.children && (
                <div>
                    {node.children.map((child) => (
                        <FileTreeItem
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            activeFileId={activeFileId}
                            onOpenFile={onOpenFile}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const FileExplorer = ({ workspaceId, activeFileId, onOpenFile }: FileExplorerProps) => {
    const [files, setFiles] = useState<FileNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                // Determine API URL based on environment or default
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
                const response = await axios.get(`${baseUrl}/workspaces/${workspaceId}/files`);
                setFiles(response.data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch files:", err);
                setError("Failed to load files");
            } finally {
                setLoading(false);
            }
        };

        if (workspaceId) {
            fetchFiles();
        }
    }, [workspaceId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center p-4 text-gray-500">
                <Loader2 className="animate-spin" size={16} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-xs">
                <p className="text-red-400 mb-2">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="text-blue-400 hover:underline"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {files.map((node) => (
                <FileTreeItem
                    key={node.id}
                    node={node}
                    depth={0}
                    activeFileId={activeFileId}
                    onOpenFile={onOpenFile}
                />
            ))}
        </div>
    );
};

export default FileExplorer;
