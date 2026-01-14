"use client";

import { useCollaborationStore } from "@/lib/yjs";

type PresenceBarProps = {
  className?: string;
  showMetrics?: boolean;
};

export default function PresenceBar({ className, showMetrics = false }: PresenceBarProps) {
  const participants = useCollaborationStore((state) => state.participants);
  const status = useCollaborationStore((state) => state.status) ?? "disconnected";
  const metrics = useCollaborationStore((state) => state.metrics);

  // Use participants directly from store - ensure it's always an array
  const safeParticipants = Array.isArray(participants) ? participants : [];

  const statusColor =
    status === "connected"
      ? "bg-emerald-500"
      : status === "connecting"
      ? "bg-yellow-400 animate-pulse"
      : "bg-red-500";

  const statusText = status === "connected" ? "Live" : status === "connecting" ? "Connecting" : "Offline";

  return (
    <div className={`flex items-center gap-4 ${className ?? ""}`}>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700">
        <span className={`inline-block h-2 w-2 rounded-full ${statusColor}`} />
        <span className="text-xs font-medium text-gray-300">{statusText}</span>
      </div>

      <div className="flex items-center gap-2">
        {safeParticipants.length > 0 ? (
          <>
            {safeParticipants.map((user, index) => (
              <div
                key={user.id}
                className="group relative flex items-center"
                style={{ zIndex: safeParticipants.length - index }}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white border-2 border-gray-900 shadow-lg transition-transform hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: user.color || "#6366F1" }}
                  title={user.name || "Anonymous User"}
                >
                  {user.initials || "?"}
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-gray-700 shadow-xl z-50">
                  {user.name || "Anonymous User"}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            ))}
            <span className="text-xs text-gray-400 ml-1">
              {safeParticipants.length} {safeParticipants.length === 1 ? "user" : "users"}
            </span>
          </>
        ) : (
          <span className="text-xs text-gray-500 italic">No collaborators</span>
        )}
      </div>

      {showMetrics && status === "connected" && (
        <div className="flex items-center gap-3 text-xs text-gray-400 ml-auto">
          {metrics.lastServerAckMs !== null && (
            <span title="Server acknowledgment latency">
              Ack: {metrics.lastServerAckMs}ms
            </span>
          )}
          {metrics.lastRemoteUpdateLagMs !== null && (
            <span title="Remote update lag">
              Lag: {metrics.lastRemoteUpdateLagMs}ms
            </span>
          )}
          {metrics.disconnectCount > 0 && (
            <span title="Disconnect count" className="text-yellow-500">
              DC: {metrics.disconnectCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}