import { Injectable, Logger } from '@nestjs/common';
import type { Doc } from 'yjs';
import { Doc as YDoc, applyUpdate } from 'yjs';
import { StorageService } from '../storage/storage.service';
import { CollaborationConfigService } from './collab.config';

export const DOCUMENT_ID_SEPARATOR = '::';

type ParsedDocumentId = {
  workspaceId: string;
  filePath: string;
};

@Injectable()
export class CollaborationDocumentService {
  private readonly logger = new Logger(CollaborationDocumentService.name);
  private readonly documents = new Map<string, Doc>();
  private readonly persistTimers = new Map<string, NodeJS.Timeout>();
  private readonly hydrationPromises = new Map<string, Promise<void>>();

  constructor(
    private readonly storageService: StorageService,
    private readonly config: CollaborationConfigService,
  ) {}

  async getDocument(documentId: string): Promise<Doc> {
    const existing = this.documents.get(documentId);
    if (existing) {
      const pendingHydration = this.hydrationPromises.get(documentId);
      if (pendingHydration) {
        await pendingHydration;
      }
      return existing;
    }

    const parsed = this.parseDocumentId(documentId);
    const doc = new YDoc();
    this.documents.set(documentId, doc);

    if (parsed) {
      const hydration = this.hydrateDocument(doc, parsed).finally(() => {
        this.hydrationPromises.delete(documentId);
      });
      this.hydrationPromises.set(documentId, hydration);
      await hydration;
    } else {
      this.logger.warn(
        `Document ${documentId} is missing workspace or file metadata; persistence disabled`,
      );
    }
    return doc;
  }

  async applyUpdate(documentId: string, update: Uint8Array): Promise<void> {
    const doc = await this.getDocument(documentId);
    applyUpdate(doc, update, 'collab:remote');

    this.schedulePersist(documentId);
  }

  async flushDocument(documentId: string): Promise<void> {
    const parsed = this.parseDocumentId(documentId);
    const doc = this.documents.get(documentId);
    if (!parsed || !doc) {
      return;
    }

    const pendingHydration = this.hydrationPromises.get(documentId);
    if (pendingHydration) {
      await pendingHydration;
    }

    this.clearPersistTimer(documentId);
    await this.persistToStorage(documentId, doc, parsed);
  }

  private async hydrateDocument(
    doc: Doc,
    metadata: ParsedDocumentId,
  ): Promise<void> {
    try {
      const content = await this.storageService.getFile(
        metadata.workspaceId,
        metadata.filePath,
      );

      if (typeof content === 'string' && content.length > 0) {
        const text = doc.getText('content');
        doc.transact(() => {
          text.insert(0, content);
        }, 'collab:hydrate');
      }
    } catch (error) {
      this.logger.warn(
        `Unable to hydrate document ${metadata.workspaceId}/${metadata.filePath}: ${error}`,
      );
    }
  }

  private schedulePersist(documentId: string): void {
    const parsed = this.parseDocumentId(documentId);
    if (!parsed) {
      return;
    }

    const existing = this.persistTimers.get(documentId);
    if (existing) {
      clearTimeout(existing);
    }

    const timeout = setTimeout(() => {
      this.persistTimers.delete(documentId);
      const doc = this.documents.get(documentId);
      if (!doc) {
        return;
      }
      void this.persistToStorage(documentId, doc, parsed);
    }, this.config.persistDebounceMs);

    this.persistTimers.set(documentId, timeout);
  }

  private async persistToStorage(
    documentId: string,
    doc: Doc,
    metadata: ParsedDocumentId,
  ): Promise<void> {
    try {
      const text = doc.getText('content');
      await this.storageService.saveFile(
        metadata.workspaceId,
        metadata.filePath,
        text.toString(),
      );
    } catch (error) {
      this.logger.error(
        `Failed to persist document ${documentId}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private parseDocumentId(documentId: string): ParsedDocumentId | null {
    const separatorIndex = documentId.indexOf(DOCUMENT_ID_SEPARATOR);
    if (separatorIndex === -1) {
      return null;
    }

    const workspaceId = documentId.slice(0, separatorIndex).trim();
    const filePath = documentId
      .slice(separatorIndex + DOCUMENT_ID_SEPARATOR.length)
      .trim();

    if (!workspaceId || !filePath) {
      return null;
    }

    return { workspaceId, filePath };
  }

  private clearPersistTimer(documentId: string): void {
    const existing = this.persistTimers.get(documentId);
    if (existing) {
      clearTimeout(existing);
      this.persistTimers.delete(documentId);
    }
  }
}
