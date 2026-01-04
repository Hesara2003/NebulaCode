import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface FileNode {
    id: string;
    name: string;
    type: 'file' | 'folder';
    children?: FileNode[];
}

@Injectable()
export class StorageService implements OnModuleInit {
    private readonly STORAGE_ROOT = path.join(process.cwd(), 'workspaces-data');

    async onModuleInit() {
        try {
            await fs.mkdir(this.STORAGE_ROOT, { recursive: true });
        } catch (error) {
            console.error('Failed to create storage root:', error);
        }
    }

    private getWorkspacePath(workspaceId: string): string {
        return path.join(this.STORAGE_ROOT, workspaceId);
    }

    /**
     * Initializes a default workspace if it doesn't exist
     */
    async ensureWorkspace(workspaceId: string) {
        const workspacePath = this.getWorkspacePath(workspaceId);
        try {
            await fs.access(workspacePath);
        } catch {
            await fs.mkdir(workspacePath, { recursive: true });
            // Create a default file
            await this.saveFile(workspaceId, 'src/welcome.ts', `// Welcome to NebulaCode workspace: ${workspaceId}\nconsole.log("Hello World");`);
        }
    }

    async saveFile(workspaceId: string, filePath: string, content: string): Promise<void> {
        const fullPath = path.join(this.getWorkspacePath(workspaceId), filePath);

        // Ensure parent directory exists
        await fs.mkdir(path.dirname(fullPath), { recursive: true });

        await fs.writeFile(fullPath, content, 'utf-8');
    }

    async getFile(workspaceId: string, filePath: string): Promise<string> {
        const fullPath = path.join(this.getWorkspacePath(workspaceId), filePath);
        try {
            return await fs.readFile(fullPath, 'utf-8');
        } catch (error) {
            throw new Error(`File not found: ${filePath}`);
        }
    }

    async listFiles(workspaceId: string): Promise<FileNode[]> {
        const workspacePath = this.getWorkspacePath(workspaceId);
        await this.ensureWorkspace(workspaceId);

        return this.scanDirectory(workspacePath, workspacePath);
    }

    private async scanDirectory(basePath: string, currentPath: string): Promise<FileNode[]> {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        const nodes: FileNode[] = [];

        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            const relativePath = path.relative(basePath, fullPath).replace(/\\/g, '/'); // Ensure forward slashes for IDs

            const node: FileNode = {
                id: relativePath, // Use relative path as ID
                name: entry.name,
                type: entry.isDirectory() ? 'folder' : 'file',
            };

            if (entry.isDirectory()) {
                node.children = await this.scanDirectory(basePath, fullPath);
            }

            nodes.push(node);
        }

        // Sort folders first, then files
        return nodes.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'folder' ? -1 : 1;
        });
    }
}
