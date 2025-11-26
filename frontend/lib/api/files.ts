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
  const { data } = await apiClient.get<FileEntity>(
    `/workspaces/${workspaceId}/files/${fileId}`
  );

  return data;
};
