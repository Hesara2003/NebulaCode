"use client";

import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import type { PresenceUser } from "./store";
import { getApiBaseUrl } from "../api/httpClient";

const resolveSocketBaseUrl = () => {
  const explicitSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  const baseUrl = explicitSocketUrl ?? getApiBaseUrl();
  return baseUrl.replace(/\/$/, "");
};

export function createCollaborationSocket(user: PresenceUser): Socket {
  const url = `${resolveSocketBaseUrl()}/editor-sync`;
  return io(url, {
    transports: ["websocket"],
    autoConnect: false,
    path: "/editor-sync/socket.io",
    auth: {
      userId: user.id,
      name: user.name,
      initials: user.initials,
      color: user.color,
    },
  });
}