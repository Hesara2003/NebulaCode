import { apiClient } from "./httpClient";

export type RunStatus = "queued" | "running" | "completed" | "failed" | "cancelled" | "unknown";

export interface CreateRunPayload {
  workspaceId: string;
  fileId: string;
  language?: string;
}

export interface RunResponse {
  runId: string;
  status: RunStatus;
}

export const createRun = async (payload: CreateRunPayload): Promise<RunResponse> => {
  const { data } = await apiClient.post<RunResponse>("/run", payload);
  return data;
};
