import { apiClient } from "./httpClient";
import { isAxiosError } from "axios";

export type RunStatus = "queued" | "running" | "completed" | "failed" | "cancelled" | "timed_out" | "unknown";

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
  try {
    const { data } = await apiClient.get<RunResponse>(`/run/${runId}/status`);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      // Treat missing runs as "unknown" instead of throwing, so UI can recover gracefully
      const now = new Date().toISOString();
      return {
        runId,
        status: "unknown",
        workspaceId: "",
        fileId: "",
        createdAt: now,
        updatedAt: now,
      };
    }
    throw error;
  }
};

export const getRunLogs = async (runId: string): Promise<RunLogsResponse> => {
  const { data } = await apiClient.get<RunLogsResponse>(`/run/${runId}/logs`);
  return data;
};
