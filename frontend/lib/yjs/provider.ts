"use client";

import { WebsocketProvider } from "y-websocket";
import type { Doc } from "yjs";

const DEFAULT_WS_ENDPOINT =
  process.env.NEXT_PUBLIC_COLLAB_ENDPOINT ?? "ws://localhost:1234";
const DEFAULT_ROOM = "nebula-code-placeholder-room";

export function createWebsocketProvider(doc: Doc) {
  return new WebsocketProvider(DEFAULT_WS_ENDPOINT, DEFAULT_ROOM, doc, {
    connect: false,
  });
}