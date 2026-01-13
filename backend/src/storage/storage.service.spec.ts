import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';

// Create a simpler test that doesn't mock fs
// Since StorageService uses real fs, we test the public interface with integration-style tests
describe('StorageService', () => {
    let service: StorageService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [StorageService],
        }).compile();

        service = module.get<StorageService>(StorageService);
    });

    describe('getWorkspacePath (private, tested indirectly)', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });
    });

    describe('ensureWorkspace', () => {
        it('should not throw for demo workspace', async () => {
            // This creates real files in workspaces-data/demo-workspace
            await expect(service.ensureWorkspace('demo-workspace')).resolves.not.toThrow();
        });

        it('should not throw for test workspace', async () => {
            await expect(service.ensureWorkspace('test-ws-unit')).resolves.not.toThrow();
        });
    });

    describe('saveFile and getFile', () => {
        const testWorkspace = 'unit-test-ws';
        const testFile = 'test-file.txt';
        const testContent = 'Hello from unit test';

        it('should save and retrieve file content', async () => {
            await service.ensureWorkspace(testWorkspace);
            await service.saveFile(testWorkspace, testFile, testContent);

            const content = await service.getFile(testWorkspace, testFile);

            expect(content).toBe(testContent);
        });

        it('should throw for non-existent file', async () => {
            await service.ensureWorkspace(testWorkspace);

            await expect(
                service.getFile(testWorkspace, 'non-existent-file.txt')
            ).rejects.toThrow('File not found');
        });
    });

    describe('deleteFile', () => {
        const testWorkspace = 'unit-test-ws-delete';

        it('should delete existing file', async () => {
            await service.ensureWorkspace(testWorkspace);
            await service.saveFile(testWorkspace, 'to-delete.txt', 'temp');

            await expect(
                service.deleteFile(testWorkspace, 'to-delete.txt')
            ).resolves.not.toThrow();

            // Verify it's deleted
            await expect(
                service.getFile(testWorkspace, 'to-delete.txt')
            ).rejects.toThrow('File not found');
        });

        it('should throw for non-existent file', async () => {
            await service.ensureWorkspace(testWorkspace);

            await expect(
                service.deleteFile(testWorkspace, 'not-there.txt')
            ).rejects.toThrow('Failed to delete file');
        });
    });

    describe('listFiles', () => {
        it('should list files in workspace', async () => {
            const files = await service.listFiles('demo-workspace');

            expect(Array.isArray(files)).toBe(true);
        });

        it('should create workspace if not exists', async () => {
            const files = await service.listFiles('auto-created-ws');

            expect(Array.isArray(files)).toBe(true);
        });
    });

    describe('onModuleInit', () => {
        it('should not throw', async () => {
            await expect(service.onModuleInit()).resolves.not.toThrow();
        });
    });
});
