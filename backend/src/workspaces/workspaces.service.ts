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
