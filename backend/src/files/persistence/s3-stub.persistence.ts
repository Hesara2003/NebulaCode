import { Injectable, Logger } from '@nestjs/common';
import { PersistenceStrategy } from './persistence.interface';

@Injectable()
export class S3StubPersistence implements PersistenceStrategy {
    private readonly logger = new Logger(S3StubPersistence.name);
    private storage = new Map<string, string>();

    async save(path: string, content: string): Promise<void> {
        this.logger.log(`[S3 Stub] Uploading to bucket: ${path}`);
        // Simulate network latency
        await new Promise((resolve) => setTimeout(resolve, 100));
        this.storage.set(path, content);
    }

    async load(path: string): Promise<string> {
        this.logger.log(`[S3 Stub] Downloading from bucket: ${path}`);
        await new Promise((resolve) => setTimeout(resolve, 50));
        const content = this.storage.get(path);
        if (content === undefined) {
            throw new Error(`File not found in S3 Stub: ${path}`);
        }
        return content;
    }

    async exists(path: string): Promise<boolean> {
        return this.storage.has(path);
    }

    async delete(path: string): Promise<void> {
        this.logger.log(`[S3 Stub] Deleting from bucket: ${path}`);
        this.storage.delete(path);
    }
}
