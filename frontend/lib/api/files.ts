import type { FileEntity } from "@/types/editor";
import { apiClient } from "./httpClient";

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
