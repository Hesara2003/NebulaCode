"use client";
import axios from "axios";
import { create } from "zustand";
import type { WebsocketProvider } from "y-websocket";
import type { Doc } from "yjs";
import { doc } from "./document";
import { createWebsocketProvider } from "./provider";

type ConnectionStatus = "connected" | "connecting" | "disconnected";

type PresenceUser = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

interface CollaborationState {
  doc: Doc;
  provider: WebsocketProvider | null;
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
  provider: null,
  status: "disconnected",
  currentUser: null,
  participants: [],
  cleanup: null,
  connect: () => {
    if (get().provider) {
      return;
    }

    set({ status: "connecting" });

    const provider = createWebsocketProvider(doc);
    const awareness = provider.awareness;

        const handleStatus = (event: { status: ConnectionStatus }) => {
      console.info(`[Yjs] connection status: ${event.status}`);
      set({ status: event.status });
    };

    const handleClose = (event: CloseEvent | null, _provider: WebsocketProvider) => {
      console.warn("[Yjs] connection closed", event?.code, event?.reason);
    };

    const handleError = (event: Event) => {
      console.error("[Yjs] connection error", event);
    };

    const handleAwarenessUpdate = () => {
      const states = Array.from(awareness.getStates().values());
      const participants = states
        .map((state) => state.user as PresenceUser | undefined)
        .filter((user): user is PresenceUser => Boolean(user));
      set({ participants });
    };

    provider.on("status", handleStatus);
    provider.on("connection-close", handleClose);
    provider.on("connection-error", handleError);
    awareness.on("update", handleAwarenessUpdate);

    const assignLocalState = async () => {
      const existingUser = get().currentUser;
      const user = existingUser ?? (await fetchCurrentUser());
      awareness.setLocalStateField("user", user);
      set({ currentUser: user });
      handleAwarenessUpdate();
    };

    assignLocalState().catch((error) => {
      console.error("[Yjs] unable to assign local presence", error);
    });

    provider.connect();

    set({
      provider,
      cleanup: () => {
        awareness.off("update", handleAwarenessUpdate);
        awareness.setLocalState({});
        provider.off("status", handleStatus);
        provider.off("connection-close", handleClose);
        provider.off("connection-error", handleError);
      },
    });
  },
  disconnect: () => {
    const { provider, cleanup } = get();
    if (!provider) {
      return;
    }

    cleanup?.();
    provider.disconnect();
    provider.destroy();

    set({
      provider: null,
      status: "disconnected",
      cleanup: null,
      participants: [],
    });
  },
}));

export { useCollaborationStore };
export type { ConnectionStatus, PresenceUser };