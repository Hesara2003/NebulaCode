import type { FileEntity } from "@/types/editor";
import { apiClient } from "./httpClient";

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

/**
 * Retrieves a single file and its contents. Backend should hydrate the payload
 * with the latest version stored in the workspace persistence layer.
 */
export const getFile = async (
  workspaceId: string,
  fileId: string
): Promise<FileEntity> => {
  // Use encodeURIComponent to handle paths with slashes safely if the backend expects it in the URL path segment
  const encodedFileId = encodeURIComponent(fileId);
  const { data } = await apiClient.get<FileEntity>(
    `/workspaces/${workspaceId}/files/${encodedFileId}`
  );

  return data;
};

/**
 * Persists file content to the backend.
 */
export const saveFile = async (
  workspaceId: string,
  fileId: string,
  content: string
): Promise<void> => {
  const encodedFileId = encodeURIComponent(fileId);
  await apiClient.post(
    `/workspaces/${workspaceId}/files/${encodedFileId}`,
    { content }
  );
};

/**
 * List all files in a workspace.
 */
export const listFiles = async (workspaceId: string): Promise<FileNode[]> => {
  const { data } = await apiClient.get<FileNode[]>(
    `/workspaces/${workspaceId}/files`
  );
  return data;
};

/**
 * Create a new file in the workspace.
 */
export const createFile = async (
  workspaceId: string,
  filePath: string,
  content: string = ''
): Promise<FileEntity> => {
  const { data } = await apiClient.post<FileEntity>(
    `/workspaces/${workspaceId}/files`,
    { path: filePath, content }
  );
  return data;
};

/**
 * Delete a file from the workspace.
 */
export const deleteFile = async (
  workspaceId: string,
  fileId: string
): Promise<void> => {
  const encodedFileId = encodeURIComponent(fileId);
  await apiClient.delete(`/workspaces/${workspaceId}/files/${encodedFileId}`);
};

