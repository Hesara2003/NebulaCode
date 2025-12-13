import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { WorkspaceModule } from '../../src/workspace/workspace.module';
import { WorkspaceService } from '../../src/workspace/workspace.service';

describe('Malindu — File Explorer API', () => {
  let app: INestApplication;
  let workspaceService: WorkspaceService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [WorkspaceModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    workspaceService = module.get<WorkspaceService>(WorkspaceService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /workspaces/:id/files returns folder tree', async () => {
    const res = await request(app.getHttpServer()).get('/workspaces/1/files');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('type');
      expect(res.body[0]).toHaveProperty('id');
    }
  });

  it('WorkspaceService returns correct file tree structure', () => {
    const tree = workspaceService.getFiles('1');
    expect(Array.isArray(tree)).toBe(true);
    expect(tree.length).toBeGreaterThan(0);
    expect(tree[0]).toHaveProperty('name');
    expect(tree[0]).toHaveProperty('type');
  });
});

