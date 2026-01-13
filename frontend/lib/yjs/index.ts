"use client";

export { createCollaborationSocket } from "./provider";
export { useCollaborationStore } from "./store";
export type { ConnectionStatus, PresenceUser, CollaborationMetrics } from "./store";
export {
  getDocument,
  getDocumentText,
  getAwareness,
  createMonacoBinding,
  getBinding,
  disposeBinding,
  disposeDocument,
} from "./document";
export { createDocumentId, parseDocumentId } from "./ids";