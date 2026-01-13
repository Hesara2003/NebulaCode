"use client";

import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import type { PresenceUser } from "./store";
import { getApiBaseUrl } from "../api/httpClient";

const resolveSocketBaseUrl = () => {
  const explicitCollabUrl = process.env.NEXT_PUBLIC_COLLAB_SOCKET_URL;
  const fallbackSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  const baseUrl = explicitCollabUrl ?? fallbackSocketUrl ?? getApiBaseUrl();

  try {
    const url = new URL(baseUrl);
    url.pathname = url.pathname.replace(/\/$/, "");
    return url.toString().replace(/\/$/, "");
  } catch (error) {
    console.warn("[Collab] Invalid socket base URL, falling back to API base", error);
    return getApiBaseUrl().replace(/\/$/, "");
  }
};

export function createCollaborationSocket(user: PresenceUser): Socket {
  // Backend gateway uses:
  // Namespace: /editor-sync
  // Path:      /editor-sync/socket.io
  const baseUrl = resolveSocketBaseUrl();
  const url = `${baseUrl}/editor-sync`;

  return io(url, {
    path: "/editor-sync/socket.io",
    transports: ["websocket"],
    autoConnect: false,
    withCredentials: true,
    timeout: 12_000,
    reconnectionAttempts: 5,
    reconnectionDelay: 200,
    reconnectionDelayMax: 2_000,
    auth: {
      userId: user.id,
      name: user.name,
      initials: user.initials,
      color: user.color,
      client: "web",
    },
  });
}
