import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { RunController } from '../src/run/run.controller';
import { RunService } from '../src/run/run.service';
import { WorkspacesController } from '../src/workspaces/workspaces.controller';
import { WorkspacesService } from '../src/workspaces/workspaces.service';
import { RedisService } from '../src/redis/redis.service';
import { StorageService } from '../src/storage/storage.service';
import { ConfigService } from '@nestjs/config';

describe('Run API (e2e)', () => {
    let app: INestApplication<App>;

    // Mock services for testing
    const mockRunService = {
        createRun: jest.fn().mockResolvedValue({
            runId: 'test-run-123',
            workspaceId: 'ws-1',
            fileId: 'file.ts',
            language: 'typescript',
            status: 'queued',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }),
        getRunStatus: jest.fn().mockResolvedValue({
            runId: 'test-run-123',
            status: 'queued',
        }),
        getRunLogs: jest.fn().mockResolvedValue({
            runId: 'test-run-123',
            content: 'Log output',
            filename: 'file.ts',
            updatedAt: new Date().toISOString(),
        }),
        cancelRun: jest.fn().mockResolvedValue({
            runId: 'test-run-123',
            status: 'cancelled',
        }),
        timeoutRun: jest.fn().mockResolvedValue({
            runId: 'test-run-123',
            status: 'timed_out',
        }),
    };

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [AppController, RunController],
            providers: [
                AppService,
                { provide: RunService, useValue: mockRunService },
                { provide: RedisService, useValue: {} },
                { provide: StorageService, useValue: {} },
                { provide: ConfigService, useValue: { get: jest.fn() } },
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    describe('POST /run', () => {
        it('should create a new run', () => {
            return request(app.getHttpServer())
                .post('/run')
                .send({ workspaceId: 'ws-1', fileId: 'file.ts' })
                .expect(202)
                .expect((res) => {
                    expect(res.body.runId).toBeDefined();
                    expect(res.body.status).toBe('queued');
                });
        });
    });

    describe('GET /run/:runId/status', () => {
        it('should return run status', () => {
            return request(app.getHttpServer())
                .get('/run/test-run-123/status')
                .expect(200)
                .expect((res) => {
                    expect(res.body.runId).toBe('test-run-123');
                });
        });
    });

    describe('GET /run/:runId/logs', () => {
        it('should return run logs', () => {
            return request(app.getHttpServer())
                .get('/run/test-run-123/logs')
                .expect(200)
                .expect((res) => {
                    expect(res.body.runId).toBe('test-run-123');
                    expect(res.body.content).toBeDefined();
                });
        });
    });

    describe('POST /run/:runId/cancel', () => {
        it('should cancel a run', () => {
            return request(app.getHttpServer())
                .post('/run/test-run-123/cancel')
                .expect(200)
                .expect((res) => {
                    expect(res.body.status).toBe('cancelled');
                });
        });
    });

    describe('POST /run/:runId/timeout', () => {
        it('should timeout a run', () => {
            return request(app.getHttpServer())
                .post('/run/test-run-123/timeout')
                .expect(200)
                .expect((res) => {
                    expect(res.body.status).toBe('timed_out');
                });
        });
    });
});

describe('Workspaces API (e2e)', () => {
    let app: INestApplication<App>;

    const mockWorkspacesService = {
        listFiles: jest.fn().mockResolvedValue([
            { id: 'src', name: 'src', type: 'folder', children: [] },
        ]),
        getFile: jest.fn().mockResolvedValue({
            id: 'main.ts',
            workspaceId: 'ws-1',
            name: 'main.ts',
            path: 'main.ts',
            language: 'typescript',
            content: 'console.log("hello")',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }),
        saveFile: jest.fn().mockResolvedValue(undefined),
        createFile: jest.fn().mockResolvedValue({
            id: 'new.ts',
            workspaceId: 'ws-1',
            name: 'new.ts',
            path: 'new.ts',
            language: 'typescript',
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }),
        deleteFile: jest.fn().mockResolvedValue(undefined),
    };

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [AppController, WorkspacesController],
            providers: [
                AppService,
                { provide: WorkspacesService, useValue: mockWorkspacesService },
                { provide: StorageService, useValue: {} },
                { provide: ConfigService, useValue: { get: jest.fn() } },
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    describe('GET /workspaces/:workspaceId/files', () => {
        it('should list workspace files', () => {
            return request(app.getHttpServer())
                .get('/workspaces/ws-1/files')
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });
    });

    describe('GET /workspaces/:workspaceId/files/:fileId', () => {
        it('should get a file', () => {
            return request(app.getHttpServer())
                .get('/workspaces/ws-1/files/main.ts')
                .expect(200)
                .expect((res) => {
                    expect(res.body.content).toBeDefined();
                    expect(res.body.language).toBe('typescript');
                });
        });
    });

    describe('POST /workspaces/:workspaceId/files/:fileId', () => {
        it('should save file content', () => {
            return request(app.getHttpServer())
                .post('/workspaces/ws-1/files/main.ts')
                .send({ content: 'updated content' })
                .expect(201)
                .expect((res) => {
                    expect(res.body.success).toBe(true);
                });
        });
    });

    describe('POST /workspaces/:workspaceId/files', () => {
        it('should create a new file', () => {
            return request(app.getHttpServer())
                .post('/workspaces/ws-1/files')
                .send({ path: 'new.ts', content: 'new content' })
                .expect(201)
                .expect((res) => {
                    expect(res.body.id).toBeDefined();
                });
        });
    });

    describe('DELETE /workspaces/:workspaceId/files/:fileId', () => {
        it('should delete a file', () => {
            return request(app.getHttpServer())
                .delete('/workspaces/ws-1/files/toDelete.ts')
                .expect(204);
        });
    });
});
