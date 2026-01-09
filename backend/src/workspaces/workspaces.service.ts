import { Injectable, NotFoundException } from '@nestjs/common';
import { FilesService } from '../files/files.service';

export interface WorkspaceFile {
  id: string;
  workspaceId: string;
  name: string;
  path: string;
  language: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

export interface Workspace {
  id: string;
  name: string;
  lastActiveFile?: string;
}

const MOCK_WORKSPACES: Record<string, Workspace> = {
  'demo-workspace': {
    id: 'demo-workspace',
    name: 'Demo Workspace',
    lastActiveFile: undefined,
  },
};

const MOCK_WORKSPACE_FILES: Record<string, WorkspaceFile[]> = {
  'demo-workspace': [
    {
      id: 'welcome-file',
      workspaceId: 'demo-workspace',
      name: 'welcome.ts',
      path: '/src/welcome.ts',
      language: 'typescript',
      content: `// NebulaCode demo file\n// This content is served by the backend API.\n\nexport function greet(name: string) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet('Nebula Dev'));\n`,
      createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'api-file',
      workspaceId: 'demo-workspace',
      name: 'server.ts',
      path: '/src/server.ts',
      language: 'typescript',
      content: `import { createServer } from 'http';\n\nconst server = createServer((_, res) => {\n  res.writeHead(200);\n  res.end('NebulaCode API online');\n});\n\nserver.listen(8080);\n`,
      createdAt: new Date('2024-01-03T00:00:00.000Z').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'python-file',
      workspaceId: 'demo-workspace',
      name: 'runner.py',
      path: '/scripts/runner.py',
      language: 'python',
      content: `import time\n\nif __name__ == "__main__":\n    for i in range(3):\n        print(f"Running task {i}")\n        time.sleep(0.5)\n`,
      createdAt: new Date('2024-01-05T00:00:00.000Z').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'readme-file',
      workspaceId: 'demo-workspace',
      name: 'README.md',
      path: '/README.md',
      language: 'markdown',
      content: `# Nebula Workspace\n\n- Instant cloud IDE\n- Real-time collaboration\n- AI assistance built-in\n`,
      createdAt: new Date('2024-01-07T00:00:00.000Z').toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

@Injectable()
export class WorkspacesService {
  constructor(private readonly filesService: FilesService) { }

  async getWorkspace(id: string): Promise<Workspace> {
    const workspace = MOCK_WORKSPACES[id];
    if (!workspace) {
      throw new NotFoundException(`Workspace ${id} not found`);
    }
    return workspace;
  }

  async updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace> {
    const workspace = await this.getWorkspace(id);
    MOCK_WORKSPACES[id] = { ...workspace, ...updates };
    return MOCK_WORKSPACES[id];
  }

  async getFile(workspaceId: string, fileId: string): Promise<WorkspaceFile> {
    try {
      const content = await this.filesService.getFile(workspaceId, fileId);
      return {
        id: fileId,
        workspaceId,
        name: fileId.split('/').pop() || fileId,
        path: fileId,
        language: this.getLanguageFromExt(fileId),
        content,
        createdAt: new Date().toISOString(), // Metadata not persisted yet
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new NotFoundException(`File ${fileId} not found in workspace ${workspaceId}`);
    }
  }

  async saveFile(
    workspaceId: string,
    fileId: string,
    content: string,
  ): Promise<WorkspaceFile> {
    await this.filesService.saveFile(workspaceId, fileId, content);

    return {
      id: fileId,
      workspaceId,
      name: fileId.split('/').pop() || fileId,
      path: fileId,
      language: this.getLanguageFromExt(fileId),
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async getFileTree(workspaceId: string): Promise<FileNode[]> {
    const filePaths = await this.filesService.getFiles(workspaceId);
    return this.buildFileTree(filePaths);
  }

  async createFile(workspaceId: string, fileId: string, content: string = ''): Promise<WorkspaceFile> {
    return this.saveFile(workspaceId, fileId, content);
  }

  async deleteFile(workspaceId: string, fileId: string): Promise<void> {
    await this.filesService.deleteFile(workspaceId, fileId);
  }

  async renameFile(workspaceId: string, oldFileId: string, newFileId: string): Promise<void> {
    await this.filesService.renameFile(workspaceId, oldFileId, newFileId);
  }

  private buildFileTree(paths: string[]): FileNode[] {
    const root: FileNode[] = [];

    for (const pathStr of paths) {
      const parts = pathStr.split('/');
      let currentLevel = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;
        const existingNode = currentLevel.find(node => node.name === part);

        if (existingNode) {
          if (isFile) {
            // Duplicate file? Should not happen with unique paths
          } else {
            currentLevel = existingNode.children!;
          }
        } else {
          const newNode: FileNode = {
            id: isFile ? pathStr : parts.slice(0, i + 1).join('/'),
            name: part,
            type: isFile ? 'file' : 'folder',
            children: isFile ? undefined : [],
          };
          currentLevel.push(newNode);
          if (!isFile) {
            currentLevel = newNode.children!;
          }
        }
      }
    }
    return root;
  }

  private getLanguageFromExt(filename: string): string {
    if (filename.endsWith('.ts')) return 'typescript';
    if (filename.endsWith('.js')) return 'javascript';
    if (filename.endsWith('.py')) return 'python';
    if (filename.endsWith('.md')) return 'markdown';
    if (filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.html')) return 'html';
    if (filename.endsWith('.css')) return 'css';
    return 'plaintext';
  }
}

