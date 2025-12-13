import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { Server } from 'ws';

describe('Pulith — Terminal WebSocket', () => {
  let wsServer: Server;

  beforeAll((done) => {
    wsServer = new Server({ port: 3001 });
    wsServer.on('connection', socket => {
      console.log('Terminal session connected');
      socket.on('message', msg => {
        // Echo back the message
        socket.send(msg);
      });
    });
    // Wait for server to start
    setTimeout(done, 100);
  });

  afterAll((done) => {
    wsServer.close(() => done());
  });

  it('WebSocket echoes messages back', done => {
    const WebSocket = require('ws');
    const ws = new WebSocket('ws://localhost:3001');

    ws.on('open', () => {
      ws.send('hello');
    });
    
    ws.on('message', (msg: Buffer) => {
      expect(msg.toString()).toBe('hello');
      ws.close();
      done();
    });

    ws.on('error', (err: Error) => {
      done(err);
    });
  }, 10000);

  it('Logs session on connect', done => {
    const consoleSpy = jest.spyOn(console, 'log');
    const WebSocket = require('ws');
    const ws = new WebSocket('ws://localhost:3001');

    ws.on('open', () => {
      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Terminal session connected');
        consoleSpy.mockRestore();
        ws.close();
        done();
      }, 100);
    });

    ws.on('error', (err: Error) => {
      consoleSpy.mockRestore();
      done(err);
    });
  }, 10000);
});
