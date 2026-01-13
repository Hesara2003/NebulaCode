import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CleanupService } from './cleanup.service';
import { RunService } from './run.service';
import { RunStatus, RunMetadata } from './run.types';

describe('CleanupService', () => {
    let cleanupService: CleanupService;
    let runService: jest.Mocked<RunService>;

    beforeEach(async () => {
        const mockRunService = {
            getStaleRuns: jest.fn(),
            timeoutRun: jest.fn(),
        };

        const mockConfigService = {
            get: jest.fn().mockReturnValue(30000),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CleanupService,
                { provide: RunService, useValue: mockRunService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        cleanupService = module.get<CleanupService>(CleanupService);
        runService = module.get(RunService);
    });

    describe('handleCleanup', () => {
        it('should do nothing when no stale runs exist', async () => {
            runService.getStaleRuns.mockResolvedValue([]);

            await cleanupService.handleCleanup();

            expect(runService.getStaleRuns).toHaveBeenCalledWith(30000);
            expect(runService.timeoutRun).not.toHaveBeenCalled();
        });

        it('should timeout all stale runs', async () => {
            const staleRuns: RunMetadata[] = [
                {
                    runId: 'run-1',
                    workspaceId: 'ws-1',
                    fileId: 'file-1',
                    language: 'typescript',
                    status: RunStatus.Running,
                    createdAt: '2024-01-01T00:00:00.000Z',
                    updatedAt: '2024-01-01T00:00:01.000Z',
                    startedAt: '2024-01-01T00:00:01.000Z',
                },
                {
                    runId: 'run-2',
                    workspaceId: 'ws-1',
                    fileId: 'file-2',
                    language: 'javascript',
                    status: RunStatus.Running,
                    createdAt: '2024-01-01T00:00:00.000Z',
                    updatedAt: '2024-01-01T00:00:02.000Z',
                    startedAt: '2024-01-01T00:00:02.000Z',
                },
            ];

            runService.getStaleRuns.mockResolvedValue(staleRuns);
            runService.timeoutRun.mockResolvedValue({} as RunMetadata);

            await cleanupService.handleCleanup();

            expect(runService.timeoutRun).toHaveBeenCalledTimes(2);
            expect(runService.timeoutRun).toHaveBeenCalledWith('run-1');
            expect(runService.timeoutRun).toHaveBeenCalledWith('run-2');
        });
    });

    describe('forceCleanup', () => {
        it('should return count of cleaned runs', async () => {
            const staleRuns: RunMetadata[] = [
                {
                    runId: 'run-1',
                    workspaceId: 'ws-1',
                    fileId: 'file-1',
                    language: 'typescript',
                    status: RunStatus.Running,
                    createdAt: '2024-01-01T00:00:00.000Z',
                    updatedAt: '2024-01-01T00:00:01.000Z',
                    startedAt: '2024-01-01T00:00:01.000Z',
                },
            ];

            runService.getStaleRuns.mockResolvedValue(staleRuns);
            runService.timeoutRun.mockResolvedValue({} as RunMetadata);

            const count = await cleanupService.forceCleanup();

            expect(count).toBe(1);
            expect(runService.timeoutRun).toHaveBeenCalledWith('run-1');
        });
    });
});
