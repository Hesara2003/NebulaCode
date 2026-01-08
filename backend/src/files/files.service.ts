import { Inject, Injectable } from '@nestjs/common';
import { PersistenceStrategy } from './persistence/persistence.interface';

@Injectable()
export class FilesService {
    constructor(
        @Inject('PERSISTENCE_STRATEGY') private readonly persistence: PersistenceStrategy,
        @Inject('S3_PERSISTENCE') private readonly s3Persistence: PersistenceStrategy,
    ) { }

    async saveFile(workspaceId: string, fileId: string, content: string): Promise<void> {
        const path = this.getFilePath(workspaceId, fileId);
        await this.persistence.save(path, content);
    }

    async deleteFile(workspaceId: string, fileId: string): Promise<void> {
        const path = this.getFilePath(workspaceId, fileId);
        await this.persistence.delete(path);
    }

    async getFile(workspaceId: string, fileId: string): Promise<string> {
        const path = this.getFilePath(workspaceId, fileId);
        return await this.persistence.load(path);
    }

    async getFiles(workspaceId: string): Promise<string[]> {
        return await this.persistence.list(workspaceId);
    }

    async saveLog(runId: string, content: string): Promise<void> {
        const path = `logs/${runId}.log`;
        await this.s3Persistence.save(path, content);
    }

    async getLog(runId: string): Promise<string> {
        const path = `logs/${runId}.log`;
        return await this.s3Persistence.load(path);
    }

    private getFilePath(workspaceId: string, fileId: string): string {
        return `${workspaceId}/${fileId}`;
    }
}
