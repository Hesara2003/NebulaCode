export enum RunStatus {
  Queued = 'queued',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
  TimedOut = 'timed_out',
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
  startedAt?: string; // Set when status transitions to Running
  containerId?: string; // Docker container ID for cleanup
  exitCode?: number; // Process exit code (0 = success)
}

export interface RunLogsPayload {
  runId: string;
  content: string;
  filename: string;
  updatedAt: string;
}
