"use client";

import { ReactNode, useEffect } from "react";
import { useCollaborationStore } from "../lib/yjs";
import ReconnectionBanner from "./ReconnectionBanner";
import { ErrorBoundary } from "./ErrorBoundary";

type CollaborationProviderProps = {
  children: ReactNode;
};

export default function CollaborationProvider({
  children,
}: CollaborationProviderProps) {
  const connect = useCollaborationStore((state) => state.connect);
  const disconnect = useCollaborationStore((state) => state.disconnect);
  const status = useCollaborationStore((state) => state.status);
  const participants = useCollaborationStore((state) => state.participants);
  const isReadOnly = useCollaborationStore((state) => state.isReadOnly);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  useEffect(() => {
    console.debug(`[Collaboration] status changed: ${status}`);
    if (isReadOnly && status === "disconnected") {
      console.warn("[Collaboration] Editor is now read-only due to disconnection");
    }
  }, [status, isReadOnly]);

  useEffect(() => {
    console.debug(`[Collaboration] active participants: ${participants.length}`);
  }, [participants.length]);

  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="flex items-center justify-center h-full w-full bg-red-50 dark:bg-red-900/10 p-6">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
              Collaboration Error
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {error.message || "Failed to initialize collaboration"}
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}
    >
      <ReconnectionBanner />
      {children}
    </ErrorBoundary>
  );
}