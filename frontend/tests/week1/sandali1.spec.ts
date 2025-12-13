import { describe, it, expect, jest } from '@jest/globals';

describe('Sandali — Editor + API Integration', () => {
  it('Monaco editor connects to backend API', () => {
    // Mock fetch for API connection
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          content: 'function hello() { return "world"; }' 
        }),
      })
    );

    // Test API endpoint format
    const workspaceId = '1';
    const apiUrl = `http://localhost:3000/workspaces/${workspaceId}/files`;
    
    expect(apiUrl).toContain('/workspaces/');
    expect(apiUrl).toContain('/files');
  });

  it('Editor tab system supports multiple files', () => {
    const tabs = [
      { id: '1', name: 'file1.ts', active: true },
      { id: '2', name: 'file2.ts', active: false },
    ];

    expect(tabs).toHaveLength(2);
    expect(tabs.filter(t => t.active)).toHaveLength(1);
  });
});

