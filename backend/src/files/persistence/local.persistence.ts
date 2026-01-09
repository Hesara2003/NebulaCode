import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PersistenceStrategy } from './persistence.interface';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class LocalPersistence implements PersistenceStrategy {
    private readonly storageRoot = path.resolve('./storage/workspaces');

    async save(filePath: string, content: string): Promise<void> {
        const fullPath = this.resolvePath(filePath);
        try {
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content, 'utf-8');
        } catch (error) {
            throw new InternalServerErrorException(`Failed to save file: ${error.message}`);
        }
    }

    async load(filePath: string): Promise<string> {
        const fullPath = this.resolvePath(filePath);
        try {
            return await fs.readFile(fullPath, 'utf-8');
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`File not found: ${filePath}`);
            }
            throw new InternalServerErrorException(`Failed to load file: ${error.message}`);
        }
    }

    async exists(filePath: string): Promise<boolean> {
        const fullPath = this.resolvePath(filePath);
        try {
            await fs.access(fullPath);
            return true;
        } catch {
            return false;
        }
    }

    async delete(filePath: string): Promise<void> {
        const fullPath = this.resolvePath(filePath);
        try {
            await fs.unlink(fullPath);
        } catch (error) {
            // Ignore if already gone
            if (error.code !== 'ENOENT') {
                throw new InternalServerErrorException(`Failed to delete file: ${error.message}`);
            }
        }
    }

    async rename(oldPath: string, newPath: string): Promise<void> {
        const fullOldPath = this.resolvePath(oldPath);
        const fullNewPath = this.resolvePath(newPath);
        try {
            await fs.rename(fullOldPath, fullNewPath);
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`File not found: ${oldPath}`);
            }
            throw new InternalServerErrorException(`Failed to rename file: ${error.message}`);
        }
    }

    async list(dir: string): Promise<string[]> {
        const fullPath = this.resolvePath(dir);
        try {
            const dirents = await fs.readdir(fullPath, { withFileTypes: true, recursive: true });
            return dirents
                .filter(dirent => dirent.isFile())
                .map(dirent => {
                    const absolutePath = path.join(dirent.parentPath ?? dirent.path, dirent.name);
                    return path.relative(fullPath, absolutePath).replace(/\\/g, '/');
                });
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw new InternalServerErrorException(`Failed to list files: ${error.message}`);
        }
    }

    private resolvePath(filePath: string): string {
        // Prevent directory traversal attacks
        const safePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
        return path.join(this.storageRoot, safePath);
    }
}
