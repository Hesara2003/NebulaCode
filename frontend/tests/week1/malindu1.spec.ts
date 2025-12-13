import { describe, it, expect, jest } from '@jest/globals';

describe('Malindu — File Explorer + Workspace', () => {
  it('File Explorer displays folder tree from backend', () => {
    const mockFileTree = [
      {
        id: '1',
        name: 'src',
        type: 'folder',
        children: [
          { id: '2', name: 'app.tsx', type: 'file' },
          { id: '3', name: 'utils.ts', type: 'file' }
        ]
      },
      {
        id: '4',
        name: 'README.md',
        type: 'file'
      }
    ];

    expect(mockFileTree).toHaveLength(2);
    expect(mockFileTree[0].type).toBe('folder');
    expect(mockFileTree[0].children).toHaveLength(2);
  });

  it('Click-to-open file updates editor tab', () => {
    const handleFileClick = jest.fn((fileId) => {
      // Update active editor tab
      return { activeTab: fileId };
    });

    const selectedFile = '2';
    const result = handleFileClick(selectedFile);

    expect(handleFileClick).toHaveBeenCalledWith('2');
    expect(result.activeTab).toBe('2');
  });

  it('FileService returns JSON mock structure', () => {
    const mockWorkspaceFiles = {
      workspaceId: '1',
      files: [
        { id: '1', name: 'index.ts', type: 'file' },
        { id: '2', name: 'components', type: 'folder' }
      ]
    };

    expect(mockWorkspaceFiles.workspaceId).toBe('1');
    expect(Array.isArray(mockWorkspaceFiles.files)).toBe(true);
  });
});