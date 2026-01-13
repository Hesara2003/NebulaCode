import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { StorageService } from '../storage/storage.service';

describe('WorkspacesService', () => {
    let service: WorkspacesService;
    let storageService: jest.Mocked<StorageService>;

    beforeEach(async () => {
        const mockStorageService = {
            ensureWorkspace: jest.fn(),
            getFile: jest.fn(),
            saveFile: jest.fn(),
            deleteFile: jest.fn(),
            listFiles: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WorkspacesService,
                { provide: StorageService, useValue: mockStorageService },
            ],
        }).compile();

        service = module.get<WorkspacesService>(WorkspacesService);
        storageService = module.get(StorageService);
    });

    describe('getFile', () => {
        it('should return file with correct metadata', async () => {
            storageService.ensureWorkspace.mockResolvedValue(undefined);
            storageService.getFile.mockResolvedValue('console.log("hello")');

            const file = await service.getFile('ws1', 'src/main.ts');

            expect(file.id).toBe('src/main.ts');
            expect(file.workspaceId).toBe('ws1');
            expect(file.name).toBe('main.ts');
            expect(file.path).toBe('src/main.ts');
            expect(file.language).toBe('typescript');
            expect(file.content).toBe('console.log("hello")');
            expect(file.createdAt).toBeDefined();
            expect(file.updatedAt).toBeDefined();
        });

        it('should decode URI-encoded file IDs', async () => {
            storageService.ensureWorkspace.mockResolvedValue(undefined);
            storageService.getFile.mockResolvedValue('content');

            await service.getFile('ws1', 'path%2Fto%2Ffile.ts');

            expect(storageService.getFile).toHaveBeenCalledWith('ws1', 'path/to/file.ts');
        });

        it('should throw NotFoundException for missing files', async () => {
            storageService.ensureWorkspace.mockResolvedValue(undefined);
            storageService.getFile.mockRejectedValue(new Error('ENOENT'));

            await expect(service.getFile('ws1', 'missing.ts')).rejects.toThrow(
                NotFoundException
            );
        });

        it('should detect TypeScript language from .ts extension', async () => {
            storageService.ensureWorkspace.mockResolvedValue(undefined);
            storageService.getFile.mockResolvedValue('');

            const file = await service.getFile('ws1', 'file.ts');
            expect(file.language).toBe('typescript');
        });

        it('should detect TypeScript language from .tsx extension', async () => {
            storageService.ensureWorkspace.mockResolvedValue(undefined);
            storageService.getFile.mockResolvedValue('');

            const file = await service.getFile('ws1', 'component.tsx');
            expect(file.language).toBe('typescript');
        });

        it('should detect JavaScript language from .js extension', async () => {
            storageService.ensureWorkspace.mockResolvedValue(undefined);
            storageService.getFile.mockResolvedValue('');

            const file = await service.getFile('ws1', 'script.js');
            expect(file.language).toBe('javascript');
        });

        it('should detect Python language from .py extension', async () => {
            storageService.ensureWorkspace.mockResolvedValue(undefined);
            storageService.getFile.mockResolvedValue('');

            const file = await service.getFile('ws1', 'script.py');
            expect(file.language).toBe('python');
        });

        it('should detect Markdown language from .md extension', async () => {
            storageService.ensureWorkspace.mockResolvedValue(undefined);
            storageService.getFile.mockResolvedValue('');

            const file = await service.getFile('ws1', 'README.md');
            expect(file.language).toBe('markdown');
        });

        it('should default to plaintext for unknown extensions', async () => {
            storageService.ensureWorkspace.mockResolvedValue(undefined);
            storageService.getFile.mockResolvedValue('');

            const file = await service.getFile('ws1', 'file.xyz');
            expect(file.language).toBe('plaintext');
        });
    });

    describe('saveFile', () => {
        it('should save file content through storage service', async () => {
            storageService.ensureWorkspace.mockResolvedValue(undefined);
            storageService.saveFile.mockResolvedValue(undefined);

            await service.saveFile('ws1', 'file.ts', 'new content');

            expect(storageService.ensureWorkspace).toHaveBeenCalledWith('ws1');
            expect(storageService.saveFile).toHaveBeenCalledWith('ws1', 'file.ts', 'new content');
        });

        it('should decode URI-encoded file IDs when saving', async () => {
            storageService.ensureWorkspace.mockResolvedValue(undefined);
            storageService.saveFile.mockResolvedValue(undefined);

            await service.saveFile('ws1', 'path%2Fto%2Ffile.ts', 'content');

            expect(storageService.saveFile).toHaveBeenCalledWith('ws1', 'path/to/file.ts', 'content');
        });
    });

    describe('createFile', () => {
        it('should create file and return file metadata', async () => {
            storageService.ensureWorkspace.mockResolvedValue(undefined);
            storageService.saveFile.mockResolvedValue(undefined);
            storageService.getFile.mockResolvedValue('initial content');

            const file = await service.createFile('ws1', 'new.ts', 'initial content');

            expect(storageService.saveFile).toHaveBeenCalledWith('ws1', 'new.ts', 'initial content');
            expect(file.path).toBe('new.ts');
        });

        it('should create file with empty content by default', async () => {
            storageService.ensureWorkspace.mockResolvedValue(undefined);
            storageService.saveFile.mockResolvedValue(undefined);
            storageService.getFile.mockResolvedValue('');

            await service.createFile('ws1', 'empty.ts');

            expect(storageService.saveFile).toHaveBeenCalledWith('ws1', 'empty.ts', '');
        });
    });

    describe('deleteFile', () => {
        it('should delete file through storage service', async () => {
            storageService.deleteFile.mockResolvedValue(undefined);

            await service.deleteFile('ws1', 'toDelete.ts');

            expect(storageService.deleteFile).toHaveBeenCalledWith('ws1', 'toDelete.ts');
        });

        it('should decode URI-encoded file IDs when deleting', async () => {
            storageService.deleteFile.mockResolvedValue(undefined);

            await service.deleteFile('ws1', 'path%2Fto%2Ffile.ts');

            expect(storageService.deleteFile).toHaveBeenCalledWith('ws1', 'path/to/file.ts');
        });
    });

    describe('listFiles', () => {
        it('should return files from storage service', async () => {
            const mockFiles = [
                { id: 'src', name: 'src', type: 'folder' as const, children: [] },
                { id: 'main.ts', name: 'main.ts', type: 'file' as const },
            ];
            storageService.listFiles.mockResolvedValue(mockFiles);

            const files = await service.listFiles('ws1');

            expect(files).toEqual(mockFiles);
            expect(storageService.listFiles).toHaveBeenCalledWith('ws1');
        });
    });
});
