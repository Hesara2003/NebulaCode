"use client";

import React, { useEffect, useState } from 'react';
import { File, Folder, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import axios from 'axios';

interface FileNode {
    id: string;
    name: string;
    type: 'file' | 'folder';
    children?: FileNode[];
}

const FileTreeItem = ({ node, depth }: { node: FileNode; depth: number }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => {
        if (node.type === 'folder') {
            setIsOpen(!isOpen);
        }
    };

    return (
        <div>
            <div
                className={`flex items-center gap-1 py-1 hover:bg-[#2a2d2e] cursor-pointer text-gray-300 select-none`}
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
                        <FileTreeItem key={child.id} node={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

const FileExplorer = () => {
    const [files, setFiles] = useState<FileNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await axios.get('http://localhost:4000/workspaces/default/files');
                setFiles(response.data);
            } catch (err) {
                console.error("Failed to fetch files:", err);
                setError("Failed to load files");
            } finally {
                setLoading(false);
            }
        };

        fetchFiles();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center p-4 text-gray-400">
                <Loader2 className="animate-spin" size={20} />
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-red-400 text-xs">{error}</div>;
    }

    return (
        <div className="flex flex-col">
            {files.map((node) => (
                <FileTreeItem key={node.id} node={node} depth={0} />
            ))}
        </div>
    );
};

export default FileExplorer;
