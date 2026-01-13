"use client";

import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import type { PresenceUser } from "./store";
import { getApiBaseUrl } from "../api/httpClient";

const resolveSocketBaseUrl = () => {
  const explicitCollabUrl = process.env.NEXT_PUBLIC_COLLAB_SOCKET_URL;
  const fallbackSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  const baseUrl = explicitCollabUrl ?? fallbackSocketUrl ?? getApiBaseUrl();
  return baseUrl.replace(/\/$/, "");
};

export function createCollaborationSocket(user: PresenceUser): Socket {
  // Backend gateway is namespace "editor-sync" with Socket.IO path "/editor-sync/socket.io".
  // We must set the client "path" to match, otherwise Socket.IO will hit "/socket.io" and fail
  // with "Invalid namespace".
  const url = `${resolveSocketBaseUrl()}/editor-sync`;
  return io(url, {
    path: "/editor-sync/socket.io",
    transports: ["websocket"],
    autoConnect: false,
    withCredentials: true,
    auth: {
      userId: user.id,
      name: user.name,
      initials: user.initials,
      color: user.color,
    },
  });
}