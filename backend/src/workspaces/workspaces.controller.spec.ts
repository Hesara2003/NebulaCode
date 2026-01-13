import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService, WorkspaceFile } from './workspaces.service';

describe('WorkspacesController', () => {
    let controller: WorkspacesController;
    let workspacesService: jest.Mocked<WorkspacesService>;

    const mockFile: WorkspaceFile = {
        id: 'main.ts',
        workspaceId: 'ws-1',
        name: 'main.ts',
        path: 'src/main.ts',
        language: 'typescript',
        content: 'console.log("hello")',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:01.000Z',
    };

    beforeEach(async () => {
        const mockWorkspacesService = {
            listFiles: jest.fn(),
            getFile: jest.fn(),
            saveFile: jest.fn(),
            createFile: jest.fn(),
            deleteFile: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [WorkspacesController],
            providers: [{ provide: WorkspacesService, useValue: mockWorkspacesService }],
        }).compile();

        controller = module.get<WorkspacesController>(WorkspacesController);
        workspacesService = module.get(WorkspacesService);
    });

    describe('listFiles', () => {
        it('should return list of files', async () => {
            const mockFilesList = [
                { id: 'src', name: 'src', type: 'folder' as const, children: [] },
                { id: 'main.ts', name: 'main.ts', type: 'file' as const },
            ];
            workspacesService.listFiles.mockResolvedValue(mockFilesList);

            const result = await controller.listFiles('ws-1');

            expect(result).toEqual(mockFilesList);
            expect(workspacesService.listFiles).toHaveBeenCalledWith('ws-1');
        });
    });

    describe('getFile', () => {
        it('should return file with decoded fileId', async () => {
            workspacesService.getFile.mockResolvedValue(mockFile);

            const result = await controller.getFile('ws-1', 'src%2Fmain.ts');

            expect(result).toEqual(mockFile);
            expect(workspacesService.getFile).toHaveBeenCalledWith('ws-1', 'src/main.ts');
        });

        it('should work with non-encoded fileId', async () => {
            workspacesService.getFile.mockResolvedValue(mockFile);

            await controller.getFile('ws-1', 'main.ts');

            expect(workspacesService.getFile).toHaveBeenCalledWith('ws-1', 'main.ts');
        });
    });

    describe('saveFile', () => {
        it('should save file content and return success', async () => {
            workspacesService.saveFile.mockResolvedValue(undefined);

            const result = await controller.saveFile('ws-1', 'file.ts', {
                content: 'new content',
            });

            expect(result).toEqual({ success: true });
            expect(workspacesService.saveFile).toHaveBeenCalledWith(
                'ws-1',
                'file.ts',
                'new content'
            );
        });

        it('should decode fileId before saving', async () => {
            workspacesService.saveFile.mockResolvedValue(undefined);

            await controller.saveFile('ws-1', 'path%2Fto%2Ffile.ts', {
                content: 'content',
            });

            expect(workspacesService.saveFile).toHaveBeenCalledWith(
                'ws-1',
                'path/to/file.ts',
                'content'
            );
        });
    });

    describe('createFile', () => {
        it('should create file with provided content', async () => {
            workspacesService.createFile.mockResolvedValue(mockFile);

            const result = await controller.createFile('ws-1', {
                path: 'new.ts',
                content: 'initial content',
            });

            expect(result).toEqual(mockFile);
            expect(workspacesService.createFile).toHaveBeenCalledWith(
                'ws-1',
                'new.ts',
                'initial content'
            );
        });

        it('should create file with empty content by default', async () => {
            workspacesService.createFile.mockResolvedValue(mockFile);

            await controller.createFile('ws-1', { path: 'empty.ts' });

            expect(workspacesService.createFile).toHaveBeenCalledWith(
                'ws-1',
                'empty.ts',
                ''
            );
        });
    });

    describe('deleteFile', () => {
        it('should delete file', async () => {
            workspacesService.deleteFile.mockResolvedValue(undefined);

            await controller.deleteFile('ws-1', 'toDelete.ts');

            expect(workspacesService.deleteFile).toHaveBeenCalledWith('ws-1', 'toDelete.ts');
        });

        it('should decode fileId before deleting', async () => {
            workspacesService.deleteFile.mockResolvedValue(undefined);

            await controller.deleteFile('ws-1', 'path%2Fto%2Ffile.ts');

            expect(workspacesService.deleteFile).toHaveBeenCalledWith(
                'ws-1',
                'path/to/file.ts'
            );
        });
    });
});
