type RunWebSocketStatusHandler = (payload: { status: string; updatedAt?: string }) => void;

type RunWebSocketLogHandler = (payload: { line: string; stream: "stdout" | "stderr" }) => void;

type RunWebSocketErrorHandler = (error: Error) => void;

export interface RunWebSocketHandlers {
  onStatus?: RunWebSocketStatusHandler;
  onLog?: RunWebSocketLogHandler;
  onError?: RunWebSocketErrorHandler;
}

export type DisconnectRunWebSocket = () => void;

export const connectRunWebSocket = (
  runId: string,
  handlers: RunWebSocketHandlers
): DisconnectRunWebSocket => {
  const { onStatus, onLog, onError } = handlers;
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[RunWebSocket] Placeholder connection invoked for ${runId}. Waiting for Pulith's socket feed to be available.`,
      {
        hasStatusHandler: Boolean(onStatus),
        hasLogHandler: Boolean(onLog),
        hasErrorHandler: Boolean(onError),
      }
    );
  }

  const noop = () => {};

  return () => {
    noop();
  };
};
