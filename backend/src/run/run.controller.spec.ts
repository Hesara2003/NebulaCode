import { Test, TestingModule } from '@nestjs/testing';
import { RunController } from './run.controller';
import { RunService } from './run.service';
import { RunStatus, RunMetadata, RunLogsPayload } from './run.types';

describe('RunController', () => {
    let controller: RunController;
    let runService: jest.Mocked<RunService>;

    const mockMetadata: RunMetadata = {
        runId: 'run-123',
        workspaceId: 'ws-1',
        fileId: 'file.ts',
        language: 'typescript',
        status: RunStatus.Queued,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:01.000Z',
    };

    beforeEach(async () => {
        const mockRunService = {
            createRun: jest.fn(),
            getRunStatus: jest.fn(),
            getRunLogs: jest.fn(),
            cancelRun: jest.fn(),
            timeoutRun: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [RunController],
            providers: [{ provide: RunService, useValue: mockRunService }],
        }).compile();

        controller = module.get<RunController>(RunController);
        runService = module.get(RunService);
    });

    describe('createRun', () => {
        it('should create a run and return metadata', async () => {
            runService.createRun.mockResolvedValue(mockMetadata);

            const result = await controller.createRun({
                workspaceId: 'ws-1',
                fileId: 'file.ts',
            });

            expect(result).toEqual({
                runId: 'run-123',
                status: RunStatus.Queued,
                workspaceId: 'ws-1',
                fileId: 'file.ts',
                createdAt: mockMetadata.createdAt,
                updatedAt: mockMetadata.updatedAt,
            });
        });

        it('should call runService.createRun with dto', async () => {
            runService.createRun.mockResolvedValue(mockMetadata);
            const dto = { workspaceId: 'ws-1', fileId: 'main.ts' };

            await controller.createRun(dto);

            expect(runService.createRun).toHaveBeenCalledWith(dto);
        });
    });

    describe('getRunStatus', () => {
        it('should return run status', async () => {
            runService.getRunStatus.mockResolvedValue(mockMetadata);

            const result = await controller.getRunStatus('run-123');

            expect(result).toEqual(mockMetadata);
            expect(runService.getRunStatus).toHaveBeenCalledWith('run-123');
        });

        it('should propagate errors from service', async () => {
            runService.getRunStatus.mockRejectedValue(new Error('Not found'));

            await expect(controller.getRunStatus('invalid')).rejects.toThrow('Not found');
        });
    });

    describe('getRunLogs', () => {
        it('should return run logs', async () => {
            const mockLogs: RunLogsPayload = {
                runId: 'run-123',
                content: 'Output line 1\nOutput line 2',
                filename: 'file.ts',
                updatedAt: '2024-01-01T00:00:02.000Z',
            };
            runService.getRunLogs.mockResolvedValue(mockLogs);

            const result = await controller.getRunLogs('run-123');

            expect(result).toEqual(mockLogs);
            expect(runService.getRunLogs).toHaveBeenCalledWith('run-123');
        });
    });

    describe('cancelRun', () => {
        it('should cancel a run', async () => {
            const cancelledMetadata = { ...mockMetadata, status: RunStatus.Cancelled };
            runService.cancelRun.mockResolvedValue(cancelledMetadata);

            const result = await controller.cancelRun('run-123');

            expect(result.status).toBe(RunStatus.Cancelled);
            expect(runService.cancelRun).toHaveBeenCalledWith('run-123');
        });

        it('should propagate ConflictException for terminal runs', async () => {
            runService.cancelRun.mockRejectedValue(new Error('Already completed'));

            await expect(controller.cancelRun('run-123')).rejects.toThrow('Already completed');
        });
    });

    describe('timeoutRun', () => {
        it('should timeout a run', async () => {
            const timedOutMetadata = { ...mockMetadata, status: RunStatus.TimedOut };
            runService.timeoutRun.mockResolvedValue(timedOutMetadata);

            const result = await controller.timeoutRun('run-123');

            expect(result.status).toBe(RunStatus.TimedOut);
            expect(runService.timeoutRun).toHaveBeenCalledWith('run-123');
        });
    });
});
