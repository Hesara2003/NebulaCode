import { apiClient } from "./httpClient";

export const cancelRun = async (runId: string) => {
  const { data } = await apiClient.post<{ runId: string; status: string }>(
    `/runs/${runId}/cancel`
  );
  return data;
};

