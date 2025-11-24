import { Injectable, NotFoundException } from '@nestjs/common';

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
  getFile(workspaceId: string, fileId: string): WorkspaceFile {
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

    return file;
  }
}
