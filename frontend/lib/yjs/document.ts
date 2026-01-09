"use client";

import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import type { editor } from "monaco-editor";

// Dynamic import type for MonacoBinding to avoid SSR issues
type MonacoBindingClass = typeof import("y-monaco")["MonacoBinding"];
type MonacoBindingInstance = InstanceType<MonacoBindingClass>;

const documents = new Map<string, Y.Doc>();
const texts = new Map<string, Y.Text>();
const awarenessMap = new Map<string, Awareness>();
const bindings = new Map<string, MonacoBindingInstance>();
let MonacoBindingConstructor: MonacoBindingClass | null = null;

// Lazy load MonacoBinding only on client-side when needed
async function getMonacoBinding(): Promise<MonacoBindingClass> {
  if (MonacoBindingConstructor) {
    return MonacoBindingConstructor;
  }
  
  const { MonacoBinding } = await import("y-monaco");
  MonacoBindingConstructor = MonacoBinding;
  return MonacoBinding;
}

function getDocument(documentId: string): Y.Doc {
  let document = documents.get(documentId);
  if (!document) {
    document = new Y.Doc();
    documents.set(documentId, document);
  }
  return document;
}

function getDocumentText(documentId: string): Y.Text {
  let text = texts.get(documentId);
  if (!text) {
    const document = getDocument(documentId);
    text = document.getText("content");
    texts.set(documentId, text);
  }
  return text;
}

function getAwareness(documentId: string): Awareness {
  let awareness = awarenessMap.get(documentId);
  if (!awareness) {
    const doc = getDocument(documentId);
    awareness = new Awareness(doc);
    awarenessMap.set(documentId, awareness);
  }
  return awareness;
}

async function createMonacoBinding(
  documentId: string,
  monacoModel: editor.ITextModel,
  monacoEditor: editor.IStandaloneCodeEditor,
): Promise<MonacoBindingInstance> {
  // Clean up any existing binding
  disposeBinding(documentId);

  const text = getDocumentText(documentId);
  const awareness = getAwareness(documentId);

  // Dynamically import MonacoBinding to avoid SSR issues
  const MonacoBinding = await getMonacoBinding();

  console.log(`[Yjs] Creating Monaco binding for document ${documentId}`);
  console.log(`[Yjs] Text length:`, text.length);
  console.log(`[Yjs] Model value length:`, monacoModel.getValue().length);

  const binding = new MonacoBinding(
    text,
    monacoModel,
    new Set([monacoEditor]),
    awareness,
  );

  bindings.set(documentId, binding);
  console.log(`[Yjs] Created Monaco binding for document ${documentId}`);

  // Log when text changes
  text.observe(() => {
    console.log(`[Yjs] Text changed in document ${documentId}, new length:`, text.length);
  });

  return binding;
}

function getBinding(documentId: string): MonacoBindingInstance | undefined {
  return bindings.get(documentId);
}

function disposeBinding(documentId: string): void {
  const binding = bindings.get(documentId);
  if (binding) {
    binding.destroy();
    bindings.delete(documentId);
    console.log(`[Yjs] Disposed Monaco binding for document ${documentId}`);
  }
}

function disposeDocument(documentId: string): void {
  disposeBinding(documentId);

  const document = documents.get(documentId);
  if (!document) {
    return;
  }

  if (texts.has(documentId)) {
    texts.delete(documentId);
  }

  const awareness = awarenessMap.get(documentId);
  if (awareness) {
    awareness.destroy();
    awarenessMap.delete(documentId);
  }

  document.destroy();
  documents.delete(documentId);

  console.log(`[Yjs] Disposed document ${documentId}`);
}

export {
  getDocument,
  getDocumentText,
  getAwareness,
  createMonacoBinding,
  getBinding,
  disposeBinding,
  disposeDocument,
};
export type { Doc } from "yjs";