"use client";

import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { File, Folder, ChevronRight, ChevronDown, Loader2, Trash2, Edit2, FilePlus } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from '@/lib/store/workspace';
import { FileNode } from '@/types/editor';



interface FileExplorerProps {
    workspaceId: string;
    activeFileId?: string | null;
    onOpenFile?: (fileId: string) => void;
}

const FileTreeItem = ({ node, depth, activeFileId, onOpenFile }: { node: FileNode; depth: number; activeFileId?: string | null; onOpenFile?: (id: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { deleteFileAction, renameFileAction, createFileAction } = useWorkspaceStore();
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(node.name);

    const toggleOpen = () => {
        if (node.type === 'folder') {
            setIsOpen(!isOpen);
        } else {
            onOpenFile?.(node.id);
        }
    };

    const handleRenameSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (renameValue.trim() && renameValue !== node.name) {
            const parentPath = node.id.substring(0, node.id.lastIndexOf('/'));
            const newId = parentPath ? `${parentPath}/${renameValue}` : renameValue;
            // Naive ID construction. Ideally backend should handle this or we calculate carefully.
            // Backend mock simple uses path as ID.
            // Wait, node.id IS the path. 
            // Let's assume ID is path for now as per simple mock.

            try {
                // Construct new path
                const pathParts = node.id.split('/');
                pathParts.pop();
                pathParts.push(renameValue);
                const newPath = pathParts.join('/');

                await renameFileAction('demo-workspace', node.id, newPath);
            } catch (e) {
                console.error("Rename failed", e);
                setRenameValue(node.name); // Revert
            }
        }
        setIsRenaming(false);
    };

    const isActive = node.id === activeFileId;

    return (
        <div>
            <div
                className={cn(
                    "group flex items-center justify-between py-1 cursor-pointer select-none transition-colors pr-2",
                    isActive ? "bg-[#37373d] text-white" : "text-gray-300 hover:bg-[#2a2d2e]"
                )}
                style={{ paddingLeft: `${depth * 12 + 12}px` }}
                onClick={toggleOpen}
            >
                <div className="flex items-center gap-1 overflow-hidden">
                    {node.type === 'folder' && (
                        isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                    )}
                    {node.type === 'file' && <File size={14} className="ml-4 text-blue-400 shrink-0" />}
                    {node.type === 'folder' && <Folder size={14} className="text-yellow-400 shrink-0" />}

                    {isRenaming ? (
                        <form onSubmit={handleRenameSubmit} onClick={e => e.stopPropagation()}>
                            <input
                                className="bg-black text-white text-xs p-1 border border-blue-500 outline-none w-32"
                                value={renameValue}
                                onChange={e => setRenameValue(e.target.value)}
                                autoFocus
                                onBlur={() => handleRenameSubmit()}
                                onKeyDown={e => {
                                    if (e.key === 'Escape') {
                                        setRenameValue(node.name);
                                        setIsRenaming(false);
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }
                                }}
                            />
                        </form>
                    ) : (
                        <span className="text-sm ml-1 truncate">{node.name}</span>
                    )}
                </div>

                <div className="hidden group-hover:flex items-center gap-1">
                    <Edit2 size={12} className="text-gray-500 hover:text-white" onClick={(e) => {
                        e.stopPropagation();
                        setIsRenaming(true);
                    }} />
                    <Trash2 size={12} className="text-gray-500 hover:text-red-400" onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Delete ${node.name}?`)) {
                            await deleteFileAction('demo-workspace', node.id);
                        }
                    }} />
                </div>
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
    // Download the workspace zip from backend
    const handleDownloadAll = async () => {
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/export`);
            if (!res.ok) {
                alert('Failed to download workspace zip.');
                return;
            }
            const blob = await res.blob();
            saveAs(blob, `${workspaceId}.zip`);
        } catch (e) {
            alert('Error downloading workspace zip.');
        }
    };
    const { fileTree, refreshFileTree, isLoading: loading, createFileAction } = useWorkspaceStore();
    // We rely on global loading state, or local component loading? 
    // Store has global `isLoading`, but maybe specific file tree loading state is better?
    // Using store's `fileTree` which is populated by `useWorkspaceRestore` initially.

    // We can allow manual refresh or just rely on actions.

    const [isCreating, setIsCreating] = useState(false);
    const [newFileName, setNewFileName] = useState("");

    const handleCreateSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (newFileName.trim()) {
            try {
                // Naive: create at root for now. Ideally select folder.
                // Assuming path is just filename for root.
                // If we want folders, we need to strip active folder.
                await createFileAction(workspaceId, newFileName.trim(), "");
                setNewFileName("");
                setIsCreating(false);
            } catch (error) {
                console.error("Create failed", error);
            }
        } else {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex flex-col">
            <div className="flex justify-between px-4 py-1 text-xs text-gray-400 uppercase font-bold tracking-wider">
                <span>Files</span>
                <div className="flex gap-2">
                    <div
                        title="Export Workspace"
                        className="cursor-pointer hover:text-white"
                        onClick={handleDownloadAll}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </div>
                    <div title="New File" className="cursor-pointer hover:text-white" onClick={() => setIsCreating(true)}>
                        <FilePlus size={14} />
                    </div>
                </div>
            </div>

            {isCreating && (
                <div className="px-4 py-1">
                    <form onSubmit={handleCreateSubmit}>
                        <input
                            className="bg-black text-white text-xs p-1 border border-green-500 outline-none w-full"
                            placeholder="filename.ext"
                            value={newFileName}
                            onChange={e => setNewFileName(e.target.value)}
                            autoFocus
                            onBlur={() => handleCreateSubmit()}
                            onKeyDown={e => {
                                if (e.key === 'Escape') {
                                    setIsCreating(false);
                                }
                            }}
                        />
                    </form>
                </div>
            )}

            {fileTree.map((node) => (
                <FileTreeItem
                    key={node.id}
                    node={node}
                    depth={0}
                    activeFileId={activeFileId}
                    onOpenFile={onOpenFile}
                />
            ))}

            {fileTree.length === 0 && !loading && (
                <div className="text-gray-500 text-xs px-4 py-2 italic">
                    No files found.
                </div>
            )}
        </div>
    );
};

export default FileExplorer;
