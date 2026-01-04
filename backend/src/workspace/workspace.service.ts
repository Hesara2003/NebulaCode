import { Injectable } from '@nestjs/common';
import { StorageService, FileNode } from '../storage/storage.service';

@Injectable()
export class WorkspaceService {
  constructor(private readonly storageService: StorageService) { }

  async getFiles(workspaceId: string): Promise<FileNode[]> {
    return this.storageService.listFiles(workspaceId);
  }
}
