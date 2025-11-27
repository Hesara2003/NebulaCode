"use client";
import axios from "axios";
import { create } from "zustand";
import type { Socket } from "socket.io-client";
import type { Doc } from "yjs";
import { doc } from "./document";
import { createCollaborationSocket } from "./provider";

type ConnectionStatus = "connected" | "connecting" | "disconnected";

type PresenceUser = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

interface CollaborationState {
  doc: Doc;
  socket: Socket | null;
  status: ConnectionStatus;
  currentUser: PresenceUser | null;
  participants: PresenceUser[];
  connect: () => void;
  disconnect: () => void;
  cleanup: (() => void) | null;
}
const COLORS = [
  "#ff6b6b",
  "#f06595",
  "#cc5de8",
  "#845ef7",
  "#5c7cfa",
  "#339af0",
  "#22b8cf",
  "#20c997",
  "#94d82d",
  "#fcc419",
];

const generateId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
  withCredentials: true,
});

const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const deriveInitials = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) {
    return "NA";
  }
  const parts = trimmed.split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return `${first}${second}`.toUpperCase();
};

async function fetchCurrentUser(): Promise<PresenceUser> {
  try {
    const response = await api.get("/auth/profile");
    const data = response.data ?? {};
    const name = typeof data.name === "string" && data.name.trim() ? data.name : "Guest";
    return {
      id: typeof data.id === "string" && data.id.trim() ? data.id : generateId(),
      name,
      initials: deriveInitials(name),
      color: typeof data.color === "string" && data.color.trim() ? data.color : randomColor(),
    };
  } catch (error) {
    console.warn("[Yjs] failed to load /auth/profile, using fallback profile", error);
    const fallbackName = "Guest";
    return {
      id: generateId(),
      name: fallbackName,
      initials: deriveInitials(fallbackName),
      color: randomColor(),
    };
  }
}


const useCollaborationStore = create<CollaborationState>((set, get) => ({
  doc,
  socket: null,
  status: "disconnected",
  currentUser: null,
  participants: [],
  cleanup: null,
  connect: () => {
    if (get().socket) {
      return;
    }

    set({ status: "connecting" });

    const establishConnection = async () => {
      try {
        const existingUser = get().currentUser ?? (await fetchCurrentUser());

        const socket = createCollaborationSocket(existingUser);

        const handleConnect = () => {
          console.info("[Collab] socket connected", socket.id);
          set({ status: "connected" });
        };

        const handleDisconnect = () => {
          console.warn("[Collab] socket disconnected");
          set({ status: "disconnected", participants: [] });
        };

        const handleConnectError = (error: Error) => {
          console.error("[Collab] socket error", error);
          set({ status: "disconnected" });
        };

        const handlePresenceUpdate = (participants: PresenceUser[]) => {
          set({ participants });
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);
        socket.on("presence:update", handlePresenceUpdate);

        set({
          socket,
          currentUser: existingUser,
          cleanup: () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("connect_error", handleConnectError);
            socket.off("presence:update", handlePresenceUpdate);
            socket.disconnect();
          },
        });

        socket.connect();
      } catch (error) {
        console.error("[Collab] unable to connect", error);
        set({ status: "disconnected", socket: null });
      }
    };

    establishConnection().catch((error) => {
      console.error("[Collab] connection setup failed", error);
      set({ status: "disconnected", socket: null });
    });
  },
  disconnect: () => {
    const { socket, cleanup } = get();
    if (!socket) {
      return;
    }

    cleanup?.();

    set({
      socket: null,
      status: "disconnected",
      cleanup: null,
      participants: [],
    });
  },
}));

export { useCollaborationStore };
export type { ConnectionStatus, PresenceUser };