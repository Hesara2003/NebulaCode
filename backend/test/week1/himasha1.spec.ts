import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { Controller, Get, Module, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Server } from 'ws';

// Mock Auth Controller
@Controller('auth')
class AuthController {
  @Get('profile')
  getProfile() {
    return {
      username: 'testuser',
      email: 'test@example.com',
      id: '123'
    };
  }
}

// Mock Auth Module
@Module({
  controllers: [AuthController],
})
class AuthModule {}

describe('Himasha — Auth + Collaboration', () => {
  let app: INestApplication;
  let wsServer: Server;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    // Setup WebSocket server for editor-sync namespace
    wsServer = new Server({ port: 3002 });
    wsServer.on('connection', (socket) => {
      console.log('Editor-sync connection established');
      socket.on('message', (msg) => {
        // Echo back for collaboration simulation
        socket.send(msg);
      });
    });
  });

  afterAll(async () => {
    await app.close();
    if (wsServer) {
      wsServer.close();
    }
  });

  it('GET /auth/profile returns mock user', async () => {
    const res = await request(app.getHttpServer()).get('/auth/profile');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('username');
    expect(res.body).toHaveProperty('email');
    expect(res.body.username).toBe('testuser');
  });

  it('Editor-sync WebSocket namespace accepts connection', done => {
    const WebSocket = require('ws');
    const ws = new WebSocket('ws://localhost:3002');

    ws.on('open', () => {
      expect(ws.readyState).toBe(WebSocket.OPEN);
      ws.close();
      done();
    });

    ws.on('error', (err: Error) => {
      done(err);
    });
  }, 10000);
});
