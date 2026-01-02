export enum RunStatus {
  Queued = 'queued',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
  Unknown = 'unknown',
}

export interface RunMetadata {
  runId: string;
  workspaceId: string;
  fileId: string;
  language: string;
  status: RunStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RunLogsPayload {
  runId: string;
  content: string;
  filename: string;
  updatedAt: string;
}
