export interface FileEntity {
  id: string;
  name: string;
  path: string;
  language: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
  sizeInBytes?: number;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  activeFileId?: string;
  files?: FileEntity[];
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}
