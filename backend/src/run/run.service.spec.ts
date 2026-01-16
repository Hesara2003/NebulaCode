import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RunService } from './run.service';
import { RedisService } from '../redis/redis.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { RunsService } from '../runs/runs.service';
import { RunStatus, RunMetadata } from './run.types';

describe('RunService', () => {
  let runService: RunService;
  let redisService: jest.Mocked<RedisService>;
  let workspacesService: jest.Mocked<WorkspacesService>;
  let configService: jest.Mocked<ConfigService>;
  let runsService: jest.Mocked<RunsService>;

  const mockFile = {
    id: 'file-1',
    path: '/test/file.ts',
    content: 'console.log("test")',
    language: 'typescript',
  };

  beforeEach(async () => {
    const mockRedisService = {
      setJson: jest.fn(),
      getJson: jest.fn(),
      exists: jest.fn(),
      addToSet: jest.fn(),
      removeFromSet: jest.fn(),
      getSetMembers: jest.fn(),
      delete: jest.fn(),
      // Distributed locking mocks
      acquireLock: jest.fn().mockResolvedValue('mock-token'),
      releaseLock: jest.fn().mockResolvedValue(true),
      withLock: jest.fn().mockImplementation(
        async (_key: string, _ttl: number, fn: () => Promise<any>) => {
          return fn();
        },
      ),
    };

    const mockWorkspacesService = {
      getFile: jest.fn().mockResolvedValue(mockFile),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    const mockRunsService = {
      sendStatus: jest.fn(),
      sendStdout: jest.fn(),
      sendStderr: jest.fn(),
      registerClient: jest.fn(),
      unregisterClient: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RunService,
        { provide: RedisService, useValue: mockRedisService },
        { provide: WorkspacesService, useValue: mockWorkspacesService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RunsService, useValue: mockRunsService },
      ],
    }).compile();

    runService = module.get<RunService>(RunService);
    redisService = module.get(RedisService);
    workspacesService = module.get(WorkspacesService);
    configService = module.get(ConfigService);
    runsService = module.get(RunsService);
  });

  describe('createRun', () => {
    it('should create a run and add to active set', async () => {
      const dto = { workspaceId: 'ws-1', fileId: 'file-1' };

      const result = await runService.createRun(dto);

      expect(result.status).toBe(RunStatus.Queued);
      expect(result.workspaceId).toBe('ws-1');
      expect(redisService.setJson).toHaveBeenCalled();
      expect(redisService.addToSet).toHaveBeenCalledWith(
        'run:active-set',
        result.runId,
      );
    });
  });

  describe('updateRunStatus', () => {
    it('should remove run from active set when reaching terminal state', async () => {
      const runId = 'run-123';
      const mockMetadata: RunMetadata = {
        runId,
        workspaceId: 'ws-1',
        fileId: 'file-1',
        language: 'typescript',
        status: RunStatus.Running,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:01.000Z',
        startedAt: '2024-01-01T00:00:01.000Z',
      };

      redisService.getJson.mockResolvedValue(mockMetadata);

      await runService.updateRunStatus(runId, RunStatus.Completed);

      expect(redisService.removeFromSet).toHaveBeenCalledWith(
        'run:active-set',
        runId,
      );
    });

    it('should not remove from active set when not reaching terminal state', async () => {
      const runId = 'run-123';
      const mockMetadata: RunMetadata = {
        runId,
        workspaceId: 'ws-1',
        fileId: 'file-1',
        language: 'typescript',
        status: RunStatus.Queued,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:01.000Z',
      };

      redisService.getJson.mockResolvedValue(mockMetadata);

      await runService.updateRunStatus(runId, RunStatus.Running);

      expect(redisService.removeFromSet).not.toHaveBeenCalled();
    });

    it('should set startedAt when transitioning to Running', async () => {
      const runId = 'run-123';
      const mockMetadata: RunMetadata = {
        runId,
        workspaceId: 'ws-1',
        fileId: 'file-1',
        language: 'typescript',
        status: RunStatus.Queued,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:01.000Z',
      };

      redisService.getJson.mockResolvedValue(mockMetadata);

      const result = await runService.updateRunStatus(runId, RunStatus.Running);

      expect(result.startedAt).toBeDefined();
    });
  });

  describe('cancelRun', () => {
    it('should throw ConflictException if run is already in terminal state', async () => {
      const runId = 'run-123';
      const mockMetadata: RunMetadata = {
        runId,
        workspaceId: 'ws-1',
        fileId: 'file-1',
        language: 'typescript',
        status: RunStatus.Completed,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:01.000Z',
      };

      redisService.getJson.mockResolvedValue(mockMetadata);

      await expect(runService.cancelRun(runId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should cancel a run in queued state', async () => {
      const runId = 'run-123';
      const mockMetadata: RunMetadata = {
        runId,
        workspaceId: 'ws-1',
        fileId: 'file-1',
        language: 'typescript',
        status: RunStatus.Queued,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:01.000Z',
      };

      redisService.getJson.mockResolvedValue(mockMetadata);

      const result = await runService.cancelRun(runId);

      expect(result.status).toBe(RunStatus.Cancelled);
    });
  });

  describe('getStaleRuns', () => {
    it('should return empty array when no active runs', async () => {
      redisService.getSetMembers.mockResolvedValue([]);

      const result = await runService.getStaleRuns(30000);

      expect(result).toEqual([]);
    });

    it('should return stale runs that exceed threshold', async () => {
      const runId = 'run-123';
      const staleStartedAt = new Date(Date.now() - 60000).toISOString(); // 60 seconds ago
      const mockMetadata: RunMetadata = {
        runId,
        workspaceId: 'ws-1',
        fileId: 'file-1',
        language: 'typescript',
        status: RunStatus.Running,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:01.000Z',
        startedAt: staleStartedAt,
      };

      redisService.getSetMembers.mockResolvedValue([runId]);
      redisService.getJson.mockResolvedValue(mockMetadata);

      const result = await runService.getStaleRuns(30000);

      expect(result).toHaveLength(1);
      expect(result[0].runId).toBe(runId);
    });

    it('should not return runs that are within threshold', async () => {
      const runId = 'run-123';
      const recentStartedAt = new Date(Date.now() - 5000).toISOString(); // 5 seconds ago
      const mockMetadata: RunMetadata = {
        runId,
        workspaceId: 'ws-1',
        fileId: 'file-1',
        language: 'typescript',
        status: RunStatus.Running,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:01.000Z',
        startedAt: recentStartedAt,
      };

      redisService.getSetMembers.mockResolvedValue([runId]);
      redisService.getJson.mockResolvedValue(mockMetadata);

      const result = await runService.getStaleRuns(30000);

      expect(result).toHaveLength(0);
    });

    it('should remove orphaned run IDs from active set', async () => {
      const orphanedRunId = 'orphan-123';

      redisService.getSetMembers.mockResolvedValue([orphanedRunId]);
      redisService.getJson.mockResolvedValue(null);

      await runService.getStaleRuns(30000);

      expect(redisService.removeFromSet).toHaveBeenCalledWith(
        'run:active-set',
        orphanedRunId,
      );
    });
  });

  describe('getActiveRunIds', () => {
    it('should return active run IDs from Redis set', async () => {
      const activeIds = ['run-1', 'run-2', 'run-3'];
      redisService.getSetMembers.mockResolvedValue(activeIds);

      const result = await runService.getActiveRunIds();

      expect(result).toEqual(activeIds);
      expect(redisService.getSetMembers).toHaveBeenCalledWith('run:active-set');
    });
  });

  describe('getRunStatus', () => {
    it('should throw NotFoundException if run does not exist', async () => {
      redisService.getJson.mockResolvedValue(null);

      await expect(runService.getRunStatus('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return run metadata if exists', async () => {
      const mockMetadata: RunMetadata = {
        runId: 'run-123',
        workspaceId: 'ws-1',
        fileId: 'file-1',
        language: 'typescript',
        status: RunStatus.Queued,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:01.000Z',
      };

      redisService.getJson.mockResolvedValue(mockMetadata);

      const result = await runService.getRunStatus('run-123');

      expect(result).toEqual(mockMetadata);
    });
  });
});
