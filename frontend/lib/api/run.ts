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
  workspaceId: string;
  fileId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RunLogsResponse {
  runId: string;
  filename: string;
  content: string;
  updatedAt: string;
}

export const createRun = async (payload: CreateRunPayload): Promise<RunResponse> => {
  const { data } = await apiClient.post<RunResponse>("/run", payload);
  return data;
};

export const getRunStatus = async (runId: string): Promise<RunResponse> => {
  const { data } = await apiClient.get<RunResponse>(`/run/${runId}/status`);
  return data;
};

export const getRunLogs = async (runId: string): Promise<RunLogsResponse> => {
  const { data } = await apiClient.get<RunLogsResponse>(`/run/${runId}/logs`);
  return data;
};
