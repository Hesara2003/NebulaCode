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

  async getFile(workspaceId: string, fileId: string): Promise<WorkspaceFile> {
    const files = MOCK_WORKSPACE_FILES[workspaceId];

    if (!files) {
      throw new NotFoundException(`Workspace ${workspaceId} was not found.`);
    }

    const file = files.find((item) => item.id === fileId);

    if (!file) {
      throw new NotFoundException(
        `File ${fileId} was not found in workspace ${workspaceId}.`,
      );
    }

    // Try to load content from persistence
    try {
      const content = await this.filesService.getFile(workspaceId, fileId);
      return { ...file, content };
    } catch (error) {
      // If file not found in persistence, fallback to mock content (first load)
      return file;
    }
  }

  async saveFile(
    workspaceId: string,
    fileId: string,
    content: string,
  ): Promise<WorkspaceFile> {
    const files = MOCK_WORKSPACE_FILES[workspaceId];

    if (!files) {
      throw new NotFoundException(`Workspace ${workspaceId} was not found.`);
    }

    const fileIndex = files.findIndex((item) => item.id === fileId);

    if (fileIndex === -1) {
      throw new NotFoundException(
        `File ${fileId} was not found in workspace ${workspaceId}.`,
      );
    }

    // Save content to persistence
    await this.filesService.saveFile(workspaceId, fileId, content);

    const updatedFile = {
      ...files[fileIndex],
      content,
      updatedAt: new Date().toISOString(),
    };

    files[fileIndex] = updatedFile;

    return updatedFile;
  }
  getFileTree(workspaceId: string): FileNode[] {
    // Mock file tree structure
    return [
      {
        id: '1',
        name: 'src',
        type: 'folder',
        children: [
          { id: '2', name: 'welcome.ts', type: 'file' },
          { id: '3', name: 'server.ts', type: 'file' },
          {
            id: '4',
            name: 'scripts',
            type: 'folder',
            children: [
              { id: '5', name: 'runner.py', type: 'file' }
            ]
          }
        ]
      },
      { id: '6', name: 'README.md', type: 'file' },
      { id: '7', name: 'package.json', type: 'file' }
    ];
  }
}

