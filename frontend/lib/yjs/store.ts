"use client";

import { create } from "zustand";
import type { WebsocketProvider } from "y-websocket";
import type { Doc } from "yjs";
import { doc } from "./document";
import { createWebsocketProvider } from "./provider";

type ConnectionStatus = "connected" | "connecting" | "disconnected";

interface CollaborationState {
  doc: Doc;
  provider: WebsocketProvider | null;
  status: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;
  cleanup: (() => void) | null;
}

const useCollaborationStore = create<CollaborationState>((set, get) => ({
  doc,
  provider: null,
  status: "disconnected",
  cleanup: null,
  connect: () => {
    if (get().provider) {
      return;
    }

    set({ status: "connecting" });

    const provider = createWebsocketProvider(doc);

    const handleStatus = (event: { status: "connected" | "disconnected" }) => {
      console.info(`[Yjs] connection status: ${event.status}`);
      set({ status: event.status });
    };

    const handleClose = (event: CloseEvent) => {
      console.warn("[Yjs] connection closed", event.code, event.reason);
    };

    const handleError = (event: Event) => {
      console.error("[Yjs] connection error", event);
    };

    provider.on("status", handleStatus);
    provider.on("connection-close", handleClose);
    provider.on("connection-error", handleError);

    provider.connect();

    set({
      provider,
      cleanup: () => {
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
    });
  },
}));

export { useCollaborationStore };
export type { ConnectionStatus };