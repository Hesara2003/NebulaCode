import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';

export interface WorkspaceFile {
  id: string;
  workspaceId: string;
  name: string;
  path: string;
  language: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class WorkspacesService {
  constructor(private readonly storageService: StorageService) {}

  async getFile(workspaceId: string, fileId: string): Promise<WorkspaceFile> {
    try {
      // Ensure workspace and default files exist
      await this.storageService.ensureWorkspace(workspaceId);

      // Decode fileId if it's base64 encoded or just use it as relative path
      // For this implementation, we assume fileId IS the relative path (e.g., "src/main.ts")
      const decodedFileId = decodeURIComponent(fileId);
      const content = await this.storageService.getFile(
        workspaceId,
        decodedFileId,
      );

      const extension = decodedFileId.split('.').pop() || 'txt';
      const language = this.getLanguageFromExtension(extension);

      return {
        id: fileId,
        workspaceId,
        name: decodedFileId.split('/').pop() || decodedFileId,
        path: decodedFileId,
        language,
        content,
        createdAt: new Date().toISOString(), // Storage doesn't track creation time easily without stat
        updatedAt: new Date().toISOString(),
      };
    } catch {
      throw new NotFoundException(
        `File ${fileId} not found in workspace ${workspaceId}`,
      );
    }
  }

  async saveFile(
    workspaceId: string,
    fileId: string,
    content: string,
  ): Promise<void> {
    // Ensure workspace exists
    await this.storageService.ensureWorkspace(workspaceId);

    const decodedFileId = decodeURIComponent(fileId);
    await this.storageService.saveFile(workspaceId, decodedFileId, content);
  }

  async createFile(
    workspaceId: string,
    filePath: string,
    content: string = '',
  ): Promise<WorkspaceFile> {
    await this.storageService.ensureWorkspace(workspaceId);
    await this.storageService.saveFile(workspaceId, filePath, content);
    return this.getFile(workspaceId, filePath);
  }

  async deleteFile(workspaceId: string, fileId: string): Promise<void> {
    const decodedFileId = decodeURIComponent(fileId);
    await this.storageService.deleteFile(workspaceId, decodedFileId);
  }

  async listFiles(workspaceId: string) {
    return this.storageService.listFiles(workspaceId);
  }

  private getLanguageFromExtension(ext: string): string {
    const map: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      md: 'markdown',
      html: 'html',
      css: 'css',
      json: 'json',
    };
    return map[ext] || 'plaintext';
  }
}
