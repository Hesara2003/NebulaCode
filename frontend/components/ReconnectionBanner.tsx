"use client";

import { useCollaborationStore } from "@/lib/yjs";
import { useEffect, useState } from "react";

export default function ReconnectionBanner() {
  const status = useCollaborationStore((state) => state.status);
  const lastError = useCollaborationStore((state) => state.lastError);
  const reconnectAttempt = useCollaborationStore((state) => state.reconnectAttempt);
  const pendingChanges = useCollaborationStore((state) => state.pendingChanges);
  const connect = useCollaborationStore((state) => state.connect);
  const setError = useCollaborationStore((state) => state.setError);
  
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (status === "disconnected" || status === "reconnecting") {
      setIsVisible(true);
      setIsDismissed(false);
    } else if (status === "connected") {
      // Delay hiding to show success message briefly
      const timer = setTimeout(() => setIsVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleRetry = () => {
    setError(null);
    connect();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setError(null);
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  if (status === "connected") {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top">
        <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Reconnected successfully!</span>
        </div>
      </div>
    );
  }

  if (status === "reconnecting") {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top">
        <div className="bg-yellow-600 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="flex flex-col">
              <span className="font-medium">Reconnecting...</span>
              <span className="text-xs opacity-90">Attempt #{reconnectAttempt}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Disconnected state
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top max-w-md">
      <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Connection Lost</h3>
            {lastError && (
              <p className="text-sm opacity-90 mb-2">{lastError}</p>
            )}
            {pendingChanges.length > 0 && (
              <p className="text-xs opacity-75 mb-3">
                {pendingChanges.length} unsaved change{pendingChanges.length !== 1 ? 's' : ''} will be sent when reconnected
              </p>
            )}
            
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleRetry}
                className="px-4 py-1.5 bg-white text-red-600 rounded font-medium text-sm hover:bg-gray-100 transition-colors"
              >
                Retry Now
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-1.5 border border-white/30 rounded text-sm hover:bg-white/10 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 hover:bg-white/10 rounded p-1 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
