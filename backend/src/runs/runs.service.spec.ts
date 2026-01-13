import { RunsService } from './runs.service';

describe('RunsService', () => {
    let service: RunsService;
    let mockSocket: any;
    let mockSocket2: any;

    beforeEach(() => {
        service = new RunsService();

        mockSocket = {
            id: 'socket-1',
            emit: jest.fn(),
        };

        mockSocket2 = {
            id: 'socket-2',
            emit: jest.fn(),
        };
    });

    describe('registerClient', () => {
        it('should register a client for a run', () => {
            service.registerClient('run-1', mockSocket);

            // Verify client is registered by sending an event
            service.sendStdout('run-1', 'test output');

            expect(mockSocket.emit).toHaveBeenCalledWith('run-event', expect.objectContaining({
                type: 'stdout',
                data: 'test output',
            }));
        });

        it('should allow multiple clients for the same run', () => {
            service.registerClient('run-1', mockSocket);
            service.registerClient('run-1', mockSocket2);

            service.sendStdout('run-1', 'test');

            expect(mockSocket.emit).toHaveBeenCalled();
            expect(mockSocket2.emit).toHaveBeenCalled();
        });

        it('should track run association per client', () => {
            service.registerClient('run-1', mockSocket);
            service.registerClient('run-2', mockSocket2);

            service.sendStdout('run-1', 'for run 1');
            service.sendStdout('run-2', 'for run 2');

            expect(mockSocket.emit).toHaveBeenCalledWith('run-event', expect.objectContaining({
                data: 'for run 1',
            }));
            expect(mockSocket2.emit).toHaveBeenCalledWith('run-event', expect.objectContaining({
                data: 'for run 2',
            }));
        });
    });

    describe('unregisterClient', () => {
        it('should unregister a client', () => {
            service.registerClient('run-1', mockSocket);
            service.unregisterClient(mockSocket);

            // Clear previous calls
            mockSocket.emit.mockClear();

            service.sendStdout('run-1', 'after unregister');

            expect(mockSocket.emit).not.toHaveBeenCalled();
        });

        it('should handle unregistering client not in any run', () => {
            // Should not throw
            expect(() => service.unregisterClient(mockSocket)).not.toThrow();
        });

        it('should clean up run entry when last client leaves', () => {
            service.registerClient('run-1', mockSocket);
            service.unregisterClient(mockSocket);

            // Register a new client - should work normally
            service.registerClient('run-1', mockSocket2);
            service.sendStdout('run-1', 'after cleanup');

            expect(mockSocket2.emit).toHaveBeenCalled();
        });

        it('should keep other clients when one leaves', () => {
            service.registerClient('run-1', mockSocket);
            service.registerClient('run-1', mockSocket2);

            service.unregisterClient(mockSocket);

            // Clear emissions
            mockSocket.emit.mockClear();
            mockSocket2.emit.mockClear();

            service.sendStdout('run-1', 'after one left');

            expect(mockSocket.emit).not.toHaveBeenCalled();
            expect(mockSocket2.emit).toHaveBeenCalled();
        });
    });

    describe('sendStdout', () => {
        it('should broadcast stdout event to clients', () => {
            service.registerClient('run-1', mockSocket);

            service.sendStdout('run-1', 'Hello, World!');

            expect(mockSocket.emit).toHaveBeenCalledWith('run-event', {
                type: 'stdout',
                data: 'Hello, World!',
                timestamp: expect.any(String),
            });
        });

        it('should not throw for runs with no clients', () => {
            expect(() => service.sendStdout('no-clients', 'test')).not.toThrow();
        });

        it('should include ISO timestamp', () => {
            service.registerClient('run-1', mockSocket);

            service.sendStdout('run-1', 'test');

            const call = mockSocket.emit.mock.calls[0][1];
            expect(() => new Date(call.timestamp)).not.toThrow();
        });
    });

    describe('sendStderr', () => {
        it('should broadcast stderr event to clients', () => {
            service.registerClient('run-1', mockSocket);

            service.sendStderr('run-1', 'Error: something went wrong');

            expect(mockSocket.emit).toHaveBeenCalledWith('run-event', {
                type: 'stderr',
                data: 'Error: something went wrong',
                timestamp: expect.any(String),
            });
        });

        it('should not throw for runs with no clients', () => {
            expect(() => service.sendStderr('no-clients', 'error')).not.toThrow();
        });
    });

    describe('sendStatus', () => {
        it('should broadcast status event to clients', () => {
            service.registerClient('run-1', mockSocket);

            service.sendStatus('run-1', 'completed' as any);

            expect(mockSocket.emit).toHaveBeenCalledWith('run-event', {
                type: 'status',
                data: 'completed',
                reason: undefined,
                timestamp: expect.any(String),
            });
        });

        it('should include reason when provided', () => {
            service.registerClient('run-1', mockSocket);

            service.sendStatus('run-1', 'failed' as any, 'Exit code 1');

            expect(mockSocket.emit).toHaveBeenCalledWith('run-event', {
                type: 'status',
                data: 'failed',
                reason: 'Exit code 1',
                timestamp: expect.any(String),
            });
        });

        it('should not throw for runs with no clients', () => {
            expect(() => service.sendStatus('no-clients', 'running' as any)).not.toThrow();
        });
    });

    describe('broadcast (private, tested indirectly)', () => {
        it('should emit to all registered clients for a run', () => {
            service.registerClient('run-1', mockSocket);
            service.registerClient('run-1', mockSocket2);

            service.sendStdout('run-1', 'broadcast test');

            expect(mockSocket.emit).toHaveBeenCalledTimes(1);
            expect(mockSocket2.emit).toHaveBeenCalledTimes(1);
        });

        it('should not emit to clients of other runs', () => {
            service.registerClient('run-1', mockSocket);
            service.registerClient('run-2', mockSocket2);

            service.sendStdout('run-1', 'only run 1');

            expect(mockSocket.emit).toHaveBeenCalled();
            expect(mockSocket2.emit).not.toHaveBeenCalled();
        });
    });
});
