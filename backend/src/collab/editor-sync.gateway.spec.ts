import { Test, TestingModule } from '@nestjs/testing';
import { EditorSyncGateway } from './editor-sync.gateway';
import { Server, Socket } from 'socket.io';

describe('EditorSyncGateway', () => {
    let gateway: EditorSyncGateway;
    let mockServer: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [EditorSyncGateway],
        }).compile();

        gateway = module.get<EditorSyncGateway>(EditorSyncGateway);

        // Mock the WebSocket server with proper chained methods
        mockServer = {
            emit: jest.fn(),
            to: jest.fn().mockReturnThis(),
        };
        (gateway as any).server = mockServer;
    });

    const createMockSocket = (overrides: any = {}): Socket => ({
        id: 'socket-1',
        handshake: {
            query: {
                name: 'Test User',
                color: '#FF0000',
            },
        },
        join: jest.fn(),
        leave: jest.fn(),
        to: jest.fn().mockReturnValue({ emit: jest.fn() }),
        emit: jest.fn(),
        broadcast: {
            to: jest.fn().mockReturnValue({ emit: jest.fn() }),
        },
        ...overrides,
    } as unknown as Socket);

    describe('handleConnection', () => {
        it('should extract participant info from socket', () => {
            const mockSocket = createMockSocket();

            gateway.handleConnection(mockSocket);

            expect((gateway as any).participants.has('socket-1')).toBe(true);
        });

        it('should generate initials from name', () => {
            const mockSocket = createMockSocket({
                handshake: { query: { name: 'John Doe', color: '#FF0000' } },
            });

            gateway.handleConnection(mockSocket);

            const participant = (gateway as any).participants.get('socket-1');
            expect(participant.initials).toBe('JD');
        });

        it('should handle single-word names', () => {
            const mockSocket = createMockSocket({
                handshake: { query: { name: 'Alice', color: '#00FF00' } },
            });

            gateway.handleConnection(mockSocket);

            const participant = (gateway as any).participants.get('socket-1');
            expect(participant.initials).toBeTruthy();
        });

        it('should use default color when not provided', () => {
            const mockSocket = createMockSocket({
                handshake: { query: { name: 'User' } },
            });

            gateway.handleConnection(mockSocket);

            const participant = (gateway as any).participants.get('socket-1');
            expect(participant.color).toBeDefined();
        });
    });

    describe('handleDisconnect', () => {
        it('should remove participant on disconnect', () => {
            const mockSocket = createMockSocket();
            gateway.handleConnection(mockSocket);

            gateway.handleDisconnect(mockSocket);

            expect((gateway as any).participants.has('socket-1')).toBe(false);
        });
    });

    describe('handleDocumentJoin', () => {
        it('should join socket to document room', () => {
            const mockSocket = createMockSocket();
            gateway.handleConnection(mockSocket);

            gateway.handleDocumentJoin(mockSocket, { documentId: 'doc-123' });

            // Room name format is "document:${documentId}"
            expect(mockSocket.join).toHaveBeenCalledWith('document:doc-123');
        });

        it('should create document if not exists', () => {
            const mockSocket = createMockSocket();
            gateway.handleConnection(mockSocket);

            gateway.handleDocumentJoin(mockSocket, { documentId: 'new-doc' });

            expect((gateway as any).documents.has('new-doc')).toBe(true);
        });

        it('should emit presence update after joining', () => {
            const mockSocket = createMockSocket();
            gateway.handleConnection(mockSocket);

            // Clear previous calls from handleConnection
            mockSocket.emit.mockClear();

            gateway.handleDocumentJoin(mockSocket, { documentId: 'doc-123' });

            // After join, it emits presence:update
            expect(mockSocket.emit).toHaveBeenCalledWith(
                'presence:update',
                expect.any(Array)
            );
        });

        it('should reject invalid documentId', () => {
            const mockSocket = createMockSocket();
            gateway.handleConnection(mockSocket);

            gateway.handleDocumentJoin(mockSocket, { documentId: undefined });

            expect(mockSocket.join).not.toHaveBeenCalled();
        });

        it('should reject non-string documentId', () => {
            const mockSocket = createMockSocket();
            gateway.handleConnection(mockSocket);

            gateway.handleDocumentJoin(mockSocket, { documentId: 123 as any });

            expect(mockSocket.join).not.toHaveBeenCalled();
        });
    });

    describe('handleDocumentUpdate', () => {
        it('should not throw for invalid payloads', () => {
            const mockSocket = createMockSocket();
            gateway.handleConnection(mockSocket);

            expect(() =>
                gateway.handleDocumentUpdate(mockSocket, undefined)
            ).not.toThrow();
        });

        it('should reject update for missing documentId', () => {
            const mockSocket = createMockSocket();
            gateway.handleConnection(mockSocket);

            const update = new Uint8Array([0, 0]);

            expect(() => {
                gateway.handleDocumentUpdate(mockSocket, {
                    documentId: undefined,
                    update: Array.from(update),
                });
            }).not.toThrow();
        });
    });

    describe('handleDocumentLeave', () => {
        it('should leave document room', () => {
            const mockSocket = createMockSocket();
            gateway.handleConnection(mockSocket);
            gateway.handleDocumentJoin(mockSocket, { documentId: 'doc-1' });

            gateway.handleDocumentLeave(mockSocket, { documentId: 'doc-1' });

            // Room name format is "document:${documentId}"
            expect(mockSocket.leave).toHaveBeenCalledWith('document:doc-1');
        });

        it('should handle missing documentId gracefully', () => {
            const mockSocket = createMockSocket();
            gateway.handleConnection(mockSocket);

            expect(() =>
                gateway.handleDocumentLeave(mockSocket, { documentId: undefined })
            ).not.toThrow();
        });
    });

    describe('broadcastPresence', () => {
        it('should broadcast participant list to all clients', () => {
            const mockSocket = createMockSocket();
            gateway.handleConnection(mockSocket);

            expect(mockServer.emit).toHaveBeenCalledWith(
                'presence:update',
                expect.any(Array)
            );
        });
    });

    describe('helper methods', () => {
        describe('deriveInitials', () => {
            it('should derive initials from multi-word names', () => {
                const initials = (gateway as any).deriveInitials('John Doe');
                expect(initials).toBe('JD');
            });

            it('should derive initials from single-word names', () => {
                const initials = (gateway as any).deriveInitials('Alice');
                expect(initials.length).toBeGreaterThan(0);
            });

            it('should handle empty string', () => {
                const initials = (gateway as any).deriveInitials('');
                expect(initials).toBe('NN'); // Default for empty
            });
        });

        describe('roomName', () => {
            it('should generate room name from documentId', () => {
                const room = (gateway as any).roomName('doc-123');
                // Actual format is "document:${documentId}"
                expect(room).toBe('document:doc-123');
            });
        });

        describe('ensureString', () => {
            it('should return string values', () => {
                const result = (gateway as any).ensureString('test');
                expect(result).toBe('test');
            });

            it('should return undefined for non-strings', () => {
                expect((gateway as any).ensureString(123)).toBeUndefined();
                expect((gateway as any).ensureString(null)).toBeUndefined();
                expect((gateway as any).ensureString(undefined)).toBeUndefined();
            });

            it('should return undefined for empty strings', () => {
                expect((gateway as any).ensureString('')).toBeUndefined();
                expect((gateway as any).ensureString('   ')).toBeUndefined();
            });
        });

        describe('ensureUint8Array', () => {
            it('should convert array to Uint8Array', () => {
                const result = (gateway as any).ensureUint8Array([1, 2, 3]);
                expect(result).toBeInstanceOf(Uint8Array);
                expect(Array.from(result)).toEqual([1, 2, 3]);
            });

            it('should pass through Uint8Array', () => {
                const input = new Uint8Array([1, 2, 3]);
                const result = (gateway as any).ensureUint8Array(input);
                expect(result).toBe(input);
            });

            it('should return undefined for invalid input', () => {
                expect((gateway as any).ensureUint8Array('invalid')).toBeUndefined();
                expect((gateway as any).ensureUint8Array(null)).toBeUndefined();
            });
        });
    });
});
