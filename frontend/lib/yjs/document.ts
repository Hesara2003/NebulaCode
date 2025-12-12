"use client";

import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";

const documents = new Map<string, Y.Doc>();
const texts = new Map<string, Y.Text>();
const awarenessMap = new Map<string, Awareness>();

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
		awareness = new Awareness(getDocument(documentId));
		awarenessMap.set(documentId, awareness);
	}
	return awareness;
}

function disposeDocument(documentId: string): void {
	const document = documents.get(documentId);
	if (!document) {
		return;
	}

	if (texts.has(documentId)) {
		texts.delete(documentId);
	}

	const awareness = awarenessMap.get(documentId);
	awareness?.destroy?.();
	awarenessMap.delete(documentId);

	document.destroy();
	documents.delete(documentId);
}

export { getDocument, getDocumentText, getAwareness, disposeDocument };
export type { Doc } from "yjs";