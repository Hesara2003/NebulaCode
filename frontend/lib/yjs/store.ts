"use client";
import axios, { isAxiosError } from "axios";
import { create } from "zustand";
import type { Socket } from "socket.io-client";
import { applyUpdate, encodeStateVector } from "yjs";
import { getDocument, getDocumentText } from "./document";
import { createCollaborationSocket } from "./provider";

type ConnectionStatus = "connected" | "connecting" | "disconnected";

type PresenceUser = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

interface CollaborationState {
  socket: Socket | null;
  status: ConnectionStatus;
  currentUser: PresenceUser | null;
  participants: PresenceUser[];
  activeDocumentId: string | null;
  lastRemoteUpdate: { documentId: string; timestamp: number } | null;
  connect: () => Promise<Socket | null>;
  disconnect: () => void;
  joinDocument: (documentId: string) => Promise<void>;
  leaveDocument: (documentId?: string) => void;
  initializeDocument: (documentId: string, initialContent: string) => void;
  clearRemoteUpdate: () => void;
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
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
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
    if (isAxiosError(error) && error.response?.status === 404) {
      console.info("[Collab] /auth/profile missing, using fallback profile");
    } else {
      console.warn("[Yjs] failed to load /auth/profile, using fallback profile", error);
    }
    const fallbackName = "Guest";
    return {
      id: generateId(),
      name: fallbackName,
      initials: deriveInitials(fallbackName),
      color: randomColor(),
    };
  }
}

type DocumentPayload = {
  documentId?: unknown;
  update?: unknown;
  stateVector?: unknown;
};

const joinedDocuments = new Set<string>();
const documentBindings = new Map<string, () => void>();

function normalizeToUint8Array(buffer: unknown): Uint8Array | undefined {
  if (buffer instanceof Uint8Array) {
    return buffer;
  }
  if (buffer instanceof ArrayBuffer) {
    return new Uint8Array(buffer);
  }
  if (Array.isArray(buffer)) {
    return Uint8Array.from(buffer);
  }
  return undefined;
}

function ensureDocumentBinding(documentId: string, socket: Socket): void {
  if (documentBindings.has(documentId)) {
    return;
  }

  const document = getDocument(documentId);
  const handler = (update: Uint8Array, origin: unknown) => {
    if (origin === "remote" || origin === "sync") {
      return;
    }
    socket.emit("document:update", { documentId, update });
  };

  document.on("update", handler);
  documentBindings.set(documentId, () => {
    document.off("update", handler);
  });
}

function emitDocumentJoin(socket: Socket, documentId: string): void {
  const document = getDocument(documentId);
  const stateVector = encodeStateVector(document);
  socket.emit("document:join", { documentId, stateVector });
}

const useCollaborationStore = create<CollaborationState>((set, get) => ({
  socket: null,
  status: "disconnected",
  currentUser: null,
  participants: [],
  activeDocumentId: null,
  lastRemoteUpdate: null,
  cleanup: null,
  connect: async () => {
    if (get().socket) {
      return get().socket;
    }

    set({ status: "connecting" });

    try {
      const existingUser = get().currentUser ?? (await fetchCurrentUser());
      const socket = createCollaborationSocket(existingUser);

      const handleConnect = () => {
        console.info("[Collab] socket connected", socket.id);
        set({ status: "connected" });

        joinedDocuments.forEach((documentId) => {
          ensureDocumentBinding(documentId, socket);
          emitDocumentJoin(socket, documentId);
        });
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

      const handleDocumentSync = (payload: DocumentPayload) => {
        const documentId = typeof payload.documentId === "string" ? payload.documentId : undefined;
        if (!documentId) {
          return;
        }

        const update = normalizeToUint8Array(payload.update ?? payload.stateVector);
        if (!update) {
          return;
        }

        try {
          applyUpdate(getDocument(documentId), update, "sync");
        } catch (error) {
          console.error("[Collab] failed to apply sync update", error);
        }
      };

      const handleDocumentUpdate = (payload: DocumentPayload & { actor?: string }) => {
        const documentId = typeof payload.documentId === "string" ? payload.documentId : undefined;
        if (!documentId) {
          return;
        }

        const update = normalizeToUint8Array(payload.update);
        if (!update) {
          return;
        }

        try {
          applyUpdate(getDocument(documentId), update, "remote");
          set({ lastRemoteUpdate: { documentId, timestamp: Date.now() } });
        } catch (error) {
          console.error("[Collab] failed to apply remote update", error);
        }
      };

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", handleConnectError);
      socket.on("presence:update", handlePresenceUpdate);
      socket.on("document:sync", handleDocumentSync);
      socket.on("document:update", handleDocumentUpdate);

      set({
        socket,
        currentUser: existingUser,
        cleanup: () => {
          socket.off("connect", handleConnect);
          socket.off("disconnect", handleDisconnect);
          socket.off("connect_error", handleConnectError);
          socket.off("presence:update", handlePresenceUpdate);
          socket.off("document:sync", handleDocumentSync);
          socket.off("document:update", handleDocumentUpdate);
          socket.disconnect();
          documentBindings.forEach((dispose) => dispose());
          documentBindings.clear();
          joinedDocuments.clear();
        },
      });

      socket.connect();

      return socket;
    } catch (error) {
      console.error("[Collab] unable to connect", error);
      set({ status: "disconnected", socket: null });
      return null;
    }
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
      activeDocumentId: null,
      lastRemoteUpdate: null,
    });
  },
  joinDocument: async (documentId: string) => {
    if (!documentId) {
      return;
    }

    let socket = get().socket;
    if (!socket) {
      socket = await get().connect();
    }

    if (!socket) {
      console.warn("[Collab] missing socket while joining document", documentId);
      return;
    }

    joinedDocuments.add(documentId);
    ensureDocumentBinding(documentId, socket);
    emitDocumentJoin(socket, documentId);

    set({ activeDocumentId: documentId });
  },
  leaveDocument: (documentId?: string) => {
    const targetId = documentId ?? get().activeDocumentId;
    if (!targetId) {
      return;
    }

    joinedDocuments.delete(targetId);

    const { socket } = get();
    socket?.emit("document:leave", { documentId: targetId });

    const dispose = documentBindings.get(targetId);
    if (dispose) {
      dispose();
      documentBindings.delete(targetId);
    }

    set((state) => ({
      activeDocumentId:
        state.activeDocumentId === targetId ? null : state.activeDocumentId,
      lastRemoteUpdate:
        state.lastRemoteUpdate?.documentId === targetId
          ? null
          : state.lastRemoteUpdate,
    }));
  },
  initializeDocument: (documentId: string, initialContent: string) => {
    if (!documentId) {
      return;
    }

    const text = getDocumentText(documentId);
    if (text.length === 0 && initialContent) {
      const document = getDocument(documentId);
      document.transact(() => {
        text.insert(0, initialContent);
      }, "bootstrap");
    }
  },
  clearRemoteUpdate: () => set({ lastRemoteUpdate: null }),
}));

export { useCollaborationStore };
export type { ConnectionStatus, PresenceUser };