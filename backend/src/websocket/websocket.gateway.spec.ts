import { Test, TestingModule } from '@nestjs/testing';
import { WebsocketGateway } from './websocket.gateway';

describe('WebsocketGateway', () => {
  let gateway: WebsocketGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebsocketGateway],
    }).compile();

    gateway = module.get<WebsocketGateway>(WebsocketGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('afterInit', () => {
    it('should log initialization message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.afterInit();

      expect(consoleSpy).toHaveBeenCalledWith('WebSocket Gateway Initialized');
      consoleSpy.mockRestore();
    });
  });

  describe('handleConnection', () => {
    it('should log client connection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockClient = { id: 'test-socket-123' } as any;

      gateway.handleConnection(mockClient);

      expect(consoleSpy).toHaveBeenCalledWith('Client connected: test-socket-123');
      consoleSpy.mockRestore();
    });
  });

  describe('handleDisconnect', () => {
    it('should log client disconnection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockClient = { id: 'test-socket-123' } as any;

      gateway.handleDisconnect(mockClient);

      expect(consoleSpy).toHaveBeenCalledWith('Client disconnected: test-socket-123');
      consoleSpy.mockRestore();
    });
  });

  describe('handleMessage', () => {
    it('should echo message back to client', () => {
      const mockClient = {
        id: 'test-socket',
        emit: jest.fn(),
      } as any;

      gateway.handleMessage('Hello, World!', mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('message', 'Hello, World!');
    });

    it('should log received message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockClient = {
        id: 'socket-1',
        emit: jest.fn(),
      } as any;

      gateway.handleMessage('test message', mockClient);

      expect(consoleSpy).toHaveBeenCalledWith('Received message from socket-1: test message');
      consoleSpy.mockRestore();
    });
  });

  describe('handleExecute', () => {
    it('should return placeholder response', () => {
      const mockClient = {
        id: 'socket-1',
        emit: jest.fn(),
      } as any;

      gateway.handleExecute({ code: 'console.log("test")' }, mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('execute-response', {
        status: 'OK',
        message: 'Execute placeholder - not implemented yet',
      });
    });

    it('should log execute request', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockClient = { id: 'socket-1', emit: jest.fn() } as any;
      const payload = { code: 'test' };

      gateway.handleExecute(payload, mockClient);

      expect(consoleSpy).toHaveBeenCalledWith('Execute request received:', payload);
      consoleSpy.mockRestore();
    });
  });
});
