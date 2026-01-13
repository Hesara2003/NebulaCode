import { Test, TestingModule } from '@nestjs/testing';
import { RunsGateway } from './runs.gateway';
import { RunsService } from './runs.service';

describe('RunsGateway', () => {
    let gateway: RunsGateway;
    let runsService: jest.Mocked<RunsService>;

    beforeEach(async () => {
        const mockRunsService = {
            registerClient: jest.fn(),
            unregisterClient: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RunsGateway,
                { provide: RunsService, useValue: mockRunsService },
            ],
        }).compile();

        gateway = module.get<RunsGateway>(RunsGateway);
        runsService = module.get(RunsService);
    });

    describe('handleConnection', () => {
        it('should register client when runId is provided', () => {
            const mockClient = {
                id: 'socket-1',
                handshake: {
                    query: { runId: 'run-123' },
                },
                emit: jest.fn(),
                disconnect: jest.fn(),
            } as any;

            gateway.handleConnection(mockClient);

            expect(runsService.registerClient).toHaveBeenCalledWith('run-123', mockClient);
            expect(mockClient.disconnect).not.toHaveBeenCalled();
        });

        it('should disconnect client when runId is missing', () => {
            const mockClient = {
                id: 'socket-1',
                handshake: { query: {} },
                emit: jest.fn(),
                disconnect: jest.fn(),
            } as any;

            gateway.handleConnection(mockClient);

            expect(mockClient.emit).toHaveBeenCalledWith('error', 'missing-run-id');
            expect(mockClient.disconnect).toHaveBeenCalled();
            expect(runsService.registerClient).not.toHaveBeenCalled();
        });

        it('should disconnect when runId is array instead of string', () => {
            const mockClient = {
                id: 'socket-1',
                handshake: { query: { runId: ['run-1', 'run-2'] } },
                emit: jest.fn(),
                disconnect: jest.fn(),
            } as any;

            gateway.handleConnection(mockClient);

            expect(mockClient.disconnect).toHaveBeenCalled();
            expect(runsService.registerClient).not.toHaveBeenCalled();
        });

        it('should handle missing handshake gracefully', () => {
            const mockClient = {
                id: 'socket-1',
                handshake: undefined,
                emit: jest.fn(),
                disconnect: jest.fn(),
            } as any;

            gateway.handleConnection(mockClient);

            expect(mockClient.disconnect).toHaveBeenCalled();
        });
    });

    describe('handleDisconnect', () => {
        it('should unregister client on disconnect', () => {
            const mockClient = {
                id: 'socket-1',
            } as any;

            gateway.handleDisconnect(mockClient);

            expect(runsService.unregisterClient).toHaveBeenCalledWith(mockClient);
        });
    });
});
