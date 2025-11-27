"use client";

import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import type { PresenceUser } from "./store";

const DEFAULT_HTTP_ENDPOINT =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export function createCollaborationSocket(user: PresenceUser): Socket {
  const url = `${DEFAULT_HTTP_ENDPOINT.replace(/\/$/, "")}/editor-sync`;
  return io(url, {
    transports: ["websocket"],
    autoConnect: false,
    auth: {
      userId: user.id,
      name: user.name,
      initials: user.initials,
      color: user.color,
    },
  });
}