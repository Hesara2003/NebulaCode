/**
 * Utilities for persisting and restoring run state across page refreshes
 */

const RUN_STATE_PREFIX = 'nebula-run:';
const ONE_HOUR_MS = 60 * 60 * 1000;

export interface StoredRunState {
  runId: string;
  fileId: string;
  fileName: string;
  createdAt: string;
  status: string;
}

/**
 * Store a run ID for a specific file
 */
export function storeRunId(fileId: string, runId: string, fileName: string, createdAt: string, status: string): void {
  if (typeof window === 'undefined') return;

  try {
    const state: StoredRunState = {
      runId,
      fileId,
      fileName,
      createdAt,
      status,
    };
    localStorage.setItem(`${RUN_STATE_PREFIX}${fileId}`, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to store run state', error);
  }
}

/**
 * Retrieve stored run state for a specific file
 */
export function getStoredRunState(fileId: string): StoredRunState | null {
  if (typeof window === 'undefined') return null;

  try {
    const data = localStorage.getItem(`${RUN_STATE_PREFIX}${fileId}`);
    if (!data) return null;

    return JSON.parse(data) as StoredRunState;
  } catch (error) {
    console.error('Failed to retrieve run state', error);
    return null;
  }
}

/**
 * Check if a stored run state is stale (>1 hour old and in terminal status)
 */
export function isRunStateStale(state: StoredRunState): boolean {
  const terminalStatuses = ['completed', 'failed', 'cancelled', 'timed_out'];

  if (!terminalStatuses.includes(state.status)) {
    return false; // Active runs are never stale
  }

  const runAge = Date.now() - new Date(state.createdAt).getTime();
  return runAge > ONE_HOUR_MS;
}

/**
 * Remove stored run state for a specific file
 */
export function clearStoredRunState(fileId: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(`${RUN_STATE_PREFIX}${fileId}`);
  } catch (error) {
    console.error('Failed to clear run state', error);
  }
}

/**
 * Clear all stale run states from localStorage
 */
export function clearStaleRunStates(): void {
  if (typeof window === 'undefined') return;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(RUN_STATE_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          const state = JSON.parse(data) as StoredRunState;
          if (isRunStateStale(state)) {
            localStorage.removeItem(key);
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to clear stale run states', error);
  }
}

/**
 * Update the status of a stored run state
 */
export function updateStoredRunStatus(fileId: string, status: string): void {
  if (typeof window === 'undefined') return;

  try {
    const state = getStoredRunState(fileId);
    if (state) {
      state.status = status;
      localStorage.setItem(`${RUN_STATE_PREFIX}${fileId}`, JSON.stringify(state));
    }
  } catch (error) {
    console.error('Failed to update run status', error);
  }
}
