# Run System Overview

This document outlines the current end-to-end flow for executing a file from the NebulaCode editor. It reflects the state of Week 2 Day 3 implementation and highlights the remaining integration hooks that Pulith and DevOps will connect.

## Lifecycle Summary

1. **Run Request**  
   - UI disables the Run button when there is no active file, when a run is in-flight, or while the request is pending.  
   - `POST /run` receives `{ workspaceId, fileId, language }` and responds with `{ runId, status }`.
2. **Metadata Storage**  
   - Backend writes run metadata to Redis via `RedisService`; if Redis is unavailable, the in-memory Map fallback is used automatically.  
   - Every run stores timestamps and status transitions under the key `run:{runId}`.
3. **Runner Invocation**  
   - When `RUNNER_API_URL` is configured, `RunService` forwards the payload to `POST {runnerUrl}/spawn`.  
   - When it is missing (current dev setup), the service simulates status/log transitions so the UI can exercise the full flow.
4. **Status Polling Fallback**  
   - The editor polls `GET /run/:runId/status` every 3 seconds *only* while at least one run is queued or running.  
   - Polling errors surface a warning banner and offer a manual retry button while the auto-retry loop keeps running silently.
5. **Terminal Integration**  
   - Before each run the editor dispatches the `nebula-terminal-clear` event, and `TerminalComponent` resets the xterm instance.  
   - Placeholder hooks (`connectRunWebSocket`) are wired up so Pulith can stream stdout/stderr and real-time status updates when the socket endpoint is ready.
6. **Rerun + Logs**  
   - Once a run reaches a terminal state (completed/failed/cancelled), the UI reveals `Rerun` and `Download Logs` buttons.  
   - `GET /run/:runId/logs` currently returns JSON with `{ filename, content }`; the UI downloads it as a `.log` file via a Blob.  
   - The backend seeds each run with a basic log entry and appends additional lines as runner callbacks (or the simulator) arrive.

## API Surface

| Endpoint | Method | Description |
| --- | --- | --- |
| `/run` | `POST` | Validates workspace/file, creates run metadata, forwards to runner, returns `{ runId, status }`. |
| `/run/:runId/status` | `GET` | Reads metadata from Redis/fallback; returns full `RunMetadata`. |
| `/run/:runId/logs` | `GET` | Returns log payload once the run is terminal. Responds `409` if still running, `404` if missing. |

### Status Values

`queued`, `running`, `completed`, `failed`, `cancelled`, `unknown`

Transitions enforced by the UI:
- queued → running
- queued → cancelled
- running → completed/failed/cancelled
- Any unexpected status renders as `Unknown` with a purple badge.

## Frontend Notes

- **File-Level Run History**: `EditorPane` keeps a map of `fileId -> RunSnapshot`, so switching tabs preserves the latest state per file.
- **Disabled States**: Run + Rerun buttons include tooltips explaining why they are unavailable (e.g., "Another file is currently running").
- **Error Messaging**: Run start failures and polling failures display inline banners without blocking the rest of the editor.
- **Download Helper**: `downloadTextFile` handles the Blob creation/revocation, and `TerminalComponent` listens for the clear event.
- **WebSocket Hooks**: `connectRunWebSocket` (in `frontend/lib/runWebSocket.ts`) currently logs placeholder warnings. Once Pulith shares the socket endpoint and payload format, the handler can dispatch status/log updates to the same reducers used by polling.

## Backend Notes

- **Redis Integration**: Environment variable `REDIS_URL` determines whether the Redis client is used. Missing/failed connections automatically fall back to an in-memory Map.
- **Runner API**: Configured via `RUNNER_API_URL`. If absent, `RunService` simulates the lifecycle to keep the UI testable.
- **Log Storage**: Logs live under `run-logs:{runId}` in the same Redis/fallback store for now. TODOs are in place for DevOps to swap this to S3 (or another persistent store) and apply TTL/expiration semantics.

## Integration TODOs

- [ ] Replace simulated lifecycle with real callbacks from the runner service.
- [ ] Implement the WebSocket transport supplied by Pulith (status + stdout/stderr streaming).
- [ ] Move log payloads from Redis/in-memory to the agreed storage layer (S3 stub initially).  
- [ ] Document the final WebSocket message schema and reconnection/backoff strategy once it is finalized.

Once these final pieces are done, the Run flow will be fully real-time with log streaming and persistent storage.
