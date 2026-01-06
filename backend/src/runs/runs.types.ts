export type RunStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type RunStreamEvent =
  | { type: 'stdout'; data: string; timestamp?: string }
  | { type: 'stderr'; data: string; timestamp?: string }
  | {
      type: 'status';
      data: RunStatus;
      reason?: string;
      timestamp?: string;
    };

