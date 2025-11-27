import { Injectable } from '@nestjs/common';

export interface FileNode {
    id: string;
    name: string;
    type: 'file' | 'folder';
    children?: FileNode[];
}

@Injectable()
export class WorkspaceService {
    getFiles(workspaceId: string): FileNode[] {
        // Mock data for now
        return [
            {
                id: '1',
                name: 'src',
                type: 'folder',
                children: [
                    { id: '2', name: 'app.tsx', type: 'file' },
                    {
                        id: '3', name: 'components', type: 'folder', children: [
                            { id: '4', name: 'Button.tsx', type: 'file' },
                            { id: '5', name: 'Header.tsx', type: 'file' }
                        ]
                    },
                    { id: '6', name: 'utils.ts', type: 'file' }
                ]
            },
            {
                id: '7', name: 'public', type: 'folder', children: [
                    { id: '8', name: 'favicon.ico', type: 'file' }
                ]
            },
            { id: '9', name: 'package.json', type: 'file' },
            { id: '10', name: 'README.md', type: 'file' }
        ];
    }
}
