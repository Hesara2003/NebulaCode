"use client";
import axios, { isAxiosError } from "axios";
import { create } from "zustand";
import type { Socket } from "socket.io-client";
import { applyUpdate, encodeStateVector } from "yjs";
import { applyAwarenessUpdate, encodeAwarenessUpdate } from "y-protocols/awareness";
import { getDocument, getDocumentText, getAwareness } from "./document";
import { createCollaborationSocket } from "./provider";
import { toast } from "../toast";

type ConnectionStatus = "connected" | "connecting" | "disconnected" | "reconnecting";

type PresenceUser = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

interface CollaborationMetrics {
  lastConnectLatencyMs: number | null;
  lastServerAckMs: number | null;
  lastRemoteUpdateLagMs: number | null;
  disconnectCount: number;
  lastDisconnectAt: number | null;
  reconnectAttempts: number;
  totalEdits: number;
  sessionStartTime: number | null;
}

interface PendingChange {
  documentId: string;
  update: Uint8Array;
  timestamp: number;
  retryCount: number;
}

interface CollaborationState {
  socket: Socket | null;
  status: ConnectionStatus;
  currentUser: PresenceUser | null;
  participants: PresenceUser[];
  activeDocumentId: string | null;
  lastRemoteUpdate: { documentId: string; timestamp: number } | null;
  metrics: CollaborationMetrics;
  isReadOnly: boolean;
  pendingChanges: PendingChange[];
  lastError: string | null;
  reconnectAttempt: number;
  connect: () => Promise<Socket | null>;
  disconnect: () => void;
  joinDocument: (documentId: string) => Promise<void>;
  leaveDocument: (documentId?: string) => void;
  initializeDocument: (documentId: string, initialContent: string) => void;
  clearRemoteUpdate: () => void;
  setReadOnly: (readOnly: boolean) => void;
  addPendingChange: (change: PendingChange) => void;
  clearPendingChanges: () => void;
  setError: (error: string | null) => void;
  retryPendingChanges: () => Promise<void>;
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

const defaultMetrics: CollaborationMetrics = {
  lastConnectLatencyMs: null,
  lastServerAckMs: null,
  lastRemoteUpdateLagMs: null,
  disconnectCount: 0,
  lastDisconnectAt: null,
  reconnectAttempts: 0,
  totalEdits: 0,
  sessionStartTime: null,
};

const MAX_PENDING_CHANGES = 50;
const MAX_RETRY_ATTEMPTS = 3;
const AWARENESS_CLEANUP_INTERVAL = 30000; // 30 seconds

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
  clientTimestamp?: unknown;
  serverTimestamp?: unknown;
};

const joinedDocuments = new Set<string>();
const documentBindings = new Map<string, () => void>();
const pendingAckTimestamps = new Map<string, number>();

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

function ensureNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function ensureDocumentBinding(documentId: string, socket: Socket): void {
  if (documentBindings.has(documentId)) {
    return;
  }

  const document = getDocument(documentId);
  const awareness = getAwareness(documentId);

  // Handle document updates
  const documentHandler = (update: Uint8Array, origin: unknown) => {
    if (origin === "remote" || origin === "sync") {
      return;
    }
    
    const clientTimestamp = Date.now();
    const state = useCollaborationStore.getState();
    
    // Track total edits
    state.metrics.totalEdits++;
    
    // If disconnected, queue the change
    if (!socket.connected) {
      console.warn("[Collab] Queuing update while disconnected");
      state.addPendingChange({
        documentId,
        update,
        timestamp: clientTimestamp,
        retryCount: 0,
      });
      return;
    }
    
    pendingAckTimestamps.set(documentId, clientTimestamp);
    
    try {
      socket.emit("document:update", { documentId, update, clientTimestamp });
    } catch (error) {
      console.error("[Collab] Failed to send update", error);
      state.addPendingChange({
        documentId,
        update,
        timestamp: clientTimestamp,
        retryCount: 0,
      });
    }
  };

  // Handle awareness updates
  const awarenessHandler = ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
    const changedClients = added.concat(updated).concat(removed);
    const update = encodeAwarenessUpdate(awareness, changedClients);
    socket.emit("awareness:update", { documentId, update, timestamp: Date.now() });
  };

  document.on("update", documentHandler);
  awareness.on("change", awarenessHandler);

  documentBindings.set(documentId, () => {
    document.off("update", documentHandler);
    awareness.off("change", awarenessHandler);
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
  metrics: defaultMetrics,
  isReadOnly: false,
  pendingChanges: [],
  lastError: null,
  reconnectAttempt: 0,
  cleanup: null,
  connect: async () => {
    if (get().socket) {
      return get().socket;
    }

    set({ status: "connecting" });

    try {
      const existingUser = get().currentUser ?? (await fetchCurrentUser());
      const socket = createCollaborationSocket(existingUser);
      let connectStartedAt = Date.now();

      const handleConnect = () => {
        console.info("[Collab] socket connected", socket.id);
        const latency = Math.max(0, Date.now() - connectStartedAt);
        console.info(`[Collab][metrics] connect latency ${latency}ms`);
        
        set((state) => ({
          status: "connected",
          isReadOnly: false,
          lastError: null,
          reconnectAttempt: 0,
          metrics: {
            ...state.metrics,
            lastConnectLatencyMs: latency,
            sessionStartTime: state.metrics.sessionStartTime || Date.now(),
          },
        }));

        // Retry pending changes
        get().retryPendingChanges();

        joinedDocuments.forEach((documentId) => {
          ensureDocumentBinding(documentId, socket);
          emitDocumentJoin(socket, documentId);
        });
      };

      const handleDisconnect = (reason: string) => {
        console.warn("[Collab] socket disconnected:", reason);
        toast.warning("Connection lost. Editor is now read-only.", 6000);
        set((state) => ({
          status: "disconnected",
          isReadOnly: true,
          participants: [],
          lastError: `Connection lost: ${reason}`,
          metrics: {
            ...state.metrics,
            disconnectCount: state.metrics.disconnectCount + 1,
            lastDisconnectAt: Date.now(),
          },
        }));
      };

      const handleConnectError = (error: Error) => {
        console.error("[Collab] socket error", error);
        toast.error(`Connection error: ${error.message || "Unknown error"}`);
        set((state) => ({ 
          status: "disconnected",
          isReadOnly: true,
          lastError: error.message || "Connection failed",
          metrics: {
            ...state.metrics,
            reconnectAttempts: state.metrics.reconnectAttempts + 1,
          },
        }));
      };

      const handleReconnectFailed = () => {
        console.error("[Collab] reconnection failed after all attempts");        toast.error("Failed to reconnect. Please refresh the page.", 8000);        set({ 
          status: "disconnected",
          isReadOnly: true,
          lastError: "Failed to reconnect after multiple attempts",
        });
      };

      const handlePresenceUpdate = (newParticipants: PresenceUser[]) => {
        const currentParticipants = get().participants;

        // Deep compare participants to prevent unnecessary updates
        if (newParticipants.length !== currentParticipants.length) {
          set({ participants: newParticipants });
          return;
        }

        const newSet = new Set(
          newParticipants.map((p) => `${p.id}:${p.name}:${p.color}`),
        );
        const currentSet = new Set(
          currentParticipants.map((p) => `${p.id}:${p.name}:${p.color}`),
        );

        if (
          newSet.size !== currentSet.size ||
          ![...newSet].every((item) => currentSet.has(item))
        ) {
          set({ participants: newParticipants });
        }
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
          toast.error("Failed to sync document. Some changes may be lost.");
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
          const now = Date.now();
          const clientTimestamp = ensureNumber(payload.clientTimestamp);
          const remoteLag =
            clientTimestamp !== undefined ? Math.max(0, now - clientTimestamp) : null;
          if (remoteLag !== null) {
            console.info(`[Collab][metrics] remote lag ${remoteLag}ms (${documentId})`);
          }
          set((state) => ({
            lastRemoteUpdate: { documentId, timestamp: now },
            metrics:
              remoteLag !== null
                ? {
                    ...state.metrics,
                    lastRemoteUpdateLagMs: remoteLag,
                  }
                : state.metrics,
          }));
        } catch (error) {
          console.error("[Collab] failed to apply remote update", error);
        }
      };

      const handleUpdateAck = (payload: DocumentPayload) => {
        const documentId = typeof payload.documentId === "string" ? payload.documentId : undefined;
        if (!documentId) {
          return;
        }

        const expected = pendingAckTimestamps.get(documentId);
        if (expected === undefined) {
          return;
        }

        pendingAckTimestamps.delete(documentId);
        const now = Date.now();
        const ackLatency = Math.max(0, now - expected);
        console.info(`[Collab][metrics] ack latency ${ackLatency}ms (${documentId})`);

        set((state) => ({
          metrics: {
            ...state.metrics,
            lastServerAckMs: ackLatency,
          },
        }));
      };

      const handleAwarenessUpdate = (payload: { documentId?: string; update?: unknown; actor?: string }) => {
        const documentId = typeof payload.documentId === "string" ? payload.documentId : undefined;
        if (!documentId) {
          return;
        }

        const update = normalizeToUint8Array(payload.update);
        if (!update) {
          return;
        }

        try {
          const awareness = getAwareness(documentId);
          applyAwarenessUpdate(awareness, update, "remote");
        } catch (error) {
          console.error("[Collab] failed to apply awareness update", error);
        }
      };

      const handleAwarenessQuery = () => {
        // Respond to awareness query by broadcasting current awareness state
        joinedDocuments.forEach((documentId) => {
          const awareness = getAwareness(documentId);
          const states = Array.from(awareness.getStates().keys());
          if (states.length > 0) {
            const update = encodeAwarenessUpdate(awareness, states);
            socket.emit("awareness:update", { documentId, update, timestamp: Date.now() });
          }
        });
      };

      const handleReconnectAttempt = () => {
        connectStartedAt = Date.now();
        const attempt = get().reconnectAttempt + 1;
        if (attempt === 1) {
          toast.info("Attempting to reconnect...", 3000);
        }
      };

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", handleConnectError);
      socket.on("presence:update", handlePresenceUpdate);
      socket.on("document:sync", handleDocumentSync);
      socket.on("document:update", handleDocumentUpdate);
      socket.on("document:update:ack", handleUpdateAck);
      socket.on("awareness:update", handleAwarenessUpdate);
      socket.on("awareness:query", handleAwarenessQuery);
      socket.io.on("reconnect_attempt", handleReconnectAttempt);
      socket.io.on("reconnect", handleReconnectAttempt);
      socket.io.on("reconnect_failed", handleReconnectFailed);

      // Start awareness cleanup timer
      const awarenessCleanupInterval = setInterval(() => {
        joinedDocuments.forEach((documentId) => {
          const awareness = getAwareness(documentId);
          const states = awareness.getStates();
          const now = Date.now();
          
          // Remove stale awareness entries (>60 seconds old)
          states.forEach((state, clientId) => {
            const lastUpdate = (state as { lastUpdated?: number }).lastUpdated || 0;
            if (now - lastUpdate > 60000) {
              awareness.setLocalState(null);
              console.log(`[Collab] Cleaned up stale awareness for client ${clientId}`);
            }
          });
        });
      }, AWARENESS_CLEANUP_INTERVAL);

      set({
        socket,
        currentUser: existingUser,
        cleanup: () => {
          clearInterval(awarenessCleanupInterval);
          socket.off("connect", handleConnect);
          socket.off("disconnect", handleDisconnect);
          socket.off("connect_error", handleConnectError);
          socket.off("presence:update", handlePresenceUpdate);
          socket.off("document:sync", handleDocumentSync);
          socket.off("document:update", handleDocumentUpdate);
          socket.off("document:update:ack", handleUpdateAck);
          socket.off("awareness:update", handleAwarenessUpdate);
          socket.off("awareness:query", handleAwarenessQuery);
          socket.io.off("reconnect_attempt", handleReconnectAttempt);
          socket.io.off("reconnect", handleReconnectAttempt);
          socket.io.off("reconnect_failed", handleReconnectFailed);
          socket.disconnect();
          documentBindings.forEach((dispose) => dispose());
          documentBindings.clear();
          joinedDocuments.clear();
          pendingAckTimestamps.clear();
        },
      });

      socket.connect();

      return socket;
    } catch (error) {
      console.error("[Collab] unable to connect", error);
      set({ status: "disconnected", socket: null, metrics: defaultMetrics });
      return null;
    }
  },
  disconnect: () => {
    const { socket, cleanup } = get();
    if (!socket) {
      return;
    }

    cleanup?.();
    pendingAckTimestamps.clear();

    set({
      socket: null,
      status: "disconnected",
      cleanup: null,
      participants: [],
      activeDocumentId: null,
      lastRemoteUpdate: null,
      metrics: defaultMetrics,
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
    pendingAckTimestamps.delete(targetId);

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
  setReadOnly: (readOnly: boolean) => set({ isReadOnly: readOnly }),
  addPendingChange: (change: PendingChange) => {
    set((state) => {
      const pending = [...state.pendingChanges, change].slice(-MAX_PENDING_CHANGES);
      
      // Persist to localStorage for recovery
      try {
        localStorage.setItem('collab_pending_changes', JSON.stringify(
          pending.map(c => ({
            ...c,
            update: Array.from(c.update),
          }))
        ));
      } catch (error) {
        console.warn("[Collab] Failed to persist pending changes", error);
      }
      
      return { pendingChanges: pending };
    });
  },
  clearPendingChanges: () => {
    set({ pendingChanges: [] });
    try {
      localStorage.removeItem('collab_pending_changes');
    } catch (error) {
      console.warn("[Collab] Failed to clear persisted changes", error);
    }
  },
  setError: (error: string | null) => set({ lastError: error }),
  retryPendingChanges: async () => {
    const state = get();
    const { socket, pendingChanges } = state;
    
    if (!socket || !socket.connected || pendingChanges.length === 0) {
      return;
    }
    
    console.info(`[Collab] Retrying ${pendingChanges.length} pending changes`);
    
    const remaining: PendingChange[] = [];
    
    for (const change of pendingChanges) {
      if (change.retryCount >= MAX_RETRY_ATTEMPTS) {
        console.error(`[Collab] Dropping change after ${MAX_RETRY_ATTEMPTS} retries`);
        continue;
      }
      
      try {
        socket.emit("document:update", {
          documentId: change.documentId,
          update: change.update,
          clientTimestamp: change.timestamp,
        });
        console.info(`[Collab] Retried pending change for ${change.documentId}`);
      } catch (error) {
        console.error("[Collab] Failed to retry change", error);
        remaining.push({ ...change, retryCount: change.retryCount + 1 });
      }
    }
    
    set({ pendingChanges: remaining });
    
    if (remaining.length === 0) {
      state.clearPendingChanges();
    }
  },
}));

// Expose to window for console debugging
if (typeof window !== 'undefined') {
  (window as typeof window & { collabStore: typeof useCollaborationStore }).collabStore = useCollaborationStore;
}

export { useCollaborationStore };
export type { ConnectionStatus, PresenceUser, CollaborationMetrics, PendingChange };