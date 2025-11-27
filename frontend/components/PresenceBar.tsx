"use client";

import { useCollaborationStore } from "@/lib/yjs";

type PresenceBarProps = {
  className?: string;
};

export default function PresenceBar({ className }: PresenceBarProps) {
  const participants = useCollaborationStore((state) => state.participants);
  const safeParticipants = Array.isArray(participants) ? participants : [];
  const status = useCollaborationStore((state) => state.status) ?? "disconnected";

  const statusColor =
    status === "connected" ? "bg-emerald-500" : status === "connecting" ? "bg-yellow-400" : "bg-red-500";

  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-400">
        <span className={`inline-block h-2 w-2 rounded-full ${statusColor}`} />
        {status}
      </span>

      <div className="flex items-center gap-2">
        {safeParticipants.map((user) => (
          <div key={user.id} className="flex items-center gap-2 text-xs text-gray-200">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: user.color }}
              title={user.name}
            >
              {user.initials}
            </span>
          </div>
        ))}

        {safeParticipants.length === 0 && <span className="text-xs text-gray-500">No collaborators yet</span>}
      </div>
    </div>
  );
}