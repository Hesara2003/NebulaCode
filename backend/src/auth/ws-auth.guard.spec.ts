import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { WsAuthGuard } from './ws-auth.guard';

describe('WsAuthGuard', () => {
    let guard: WsAuthGuard;
    const originalEnv = process.env;

    beforeEach(() => {
        guard = new WsAuthGuard();
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    const createMockContext = (client: any): ExecutionContext => ({
        switchToWs: () => ({
            getClient: <T = any>() => client as T,
            getData: <T = any>() => ({} as T),
            getPattern: () => '',
        }),
        getType: <TContext extends string = string>() => 'ws' as TContext,
        getClass: <T = any>() => undefined as unknown as T,
        getHandler: () => undefined as any,
        getArgs: <T extends any[] = any[]>() => [] as unknown as T,
        getArgByIndex: <T = any>() => undefined as unknown as T,
        switchToHttp: () => undefined as any,
        switchToRpc: () => undefined as any,
    });

    describe('canActivate', () => {
        it('should allow valid token from Authorization header', () => {
            const mockClient = {
                handshake: {
                    headers: { authorization: 'Bearer devtoken' },
                    query: {},
                },
                data: {} as { token?: string },
                emit: jest.fn(),
                disconnect: jest.fn(),
            };
            const context = createMockContext(mockClient);

            const result = guard.canActivate(context);

            expect(result).toBe(true);
            expect(mockClient.data.token).toBe('devtoken');
            expect(mockClient.disconnect).not.toHaveBeenCalled();
        });

        it('should allow valid token from query parameter', () => {
            const mockClient = {
                handshake: {
                    headers: {},
                    query: { token: 'devtoken' },
                },
                data: {},
                emit: jest.fn(),
                disconnect: jest.fn(),
            };
            const context = createMockContext(mockClient);

            const result = guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should allow valid token from auth payload', () => {
            const mockClient = {
                handshake: {
                    headers: {},
                    query: {},
                    auth: { token: 'devtoken' },
                },
                data: {},
                emit: jest.fn(),
                disconnect: jest.fn(),
            };
            const context = createMockContext(mockClient);

            const result = guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should reject invalid token', () => {
            const mockClient = {
                handshake: {
                    headers: { authorization: 'Bearer wrongtoken' },
                    query: {},
                },
                emit: jest.fn(),
                disconnect: jest.fn(),
            };
            const context = createMockContext(mockClient);

            expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
            expect(mockClient.emit).toHaveBeenCalledWith('error', 'unauthorized');
            expect(mockClient.disconnect).toHaveBeenCalled();
        });

        it('should reject missing token', () => {
            const mockClient = {
                handshake: {
                    headers: {},
                    query: {},
                },
                emit: jest.fn(),
                disconnect: jest.fn(),
            };
            const context = createMockContext(mockClient);

            expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
        });

        it('should use WS_AUTH_TOKEN environment variable when set', () => {
            process.env.WS_AUTH_TOKEN = 'custom-token';
            guard = new WsAuthGuard(); // Re-instantiate to pick up env

            const mockClient = {
                handshake: {
                    headers: { authorization: 'Bearer custom-token' },
                    query: {},
                },
                data: {},
                emit: jest.fn(),
                disconnect: jest.fn(),
            };
            const context = createMockContext(mockClient);

            const result = guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should prefer Authorization header over query param', () => {
            const mockClient = {
                handshake: {
                    headers: { authorization: 'Bearer devtoken' },
                    query: { token: 'querytoken' },
                },
                data: {} as { token?: string },
                emit: jest.fn(),
                disconnect: jest.fn(),
            };
            const context = createMockContext(mockClient);

            guard.canActivate(context);

            expect(mockClient.data.token).toBe('devtoken');
        });

        it('should handle Authorization header without Bearer prefix', () => {
            const mockClient = {
                handshake: {
                    headers: { authorization: 'devtoken' }, // No Bearer prefix
                    query: { token: 'devtoken' }, // Should fall back to query
                },
                data: {},
                emit: jest.fn(),
                disconnect: jest.fn(),
            };
            const context = createMockContext(mockClient);

            const result = guard.canActivate(context);

            expect(result).toBe(true);
        });
    });

    describe('extractToken', () => {
        it('should extract token from Bearer header', () => {
            const mockClient = {
                handshake: {
                    headers: { authorization: 'Bearer mytoken' },
                    query: {},
                },
            };

            // Access private method via indexing
            const token = (guard as any).extractToken(mockClient);

            expect(token).toBe('mytoken');
        });

        it('should return undefined for malformed Authorization header', () => {
            const mockClient = {
                handshake: {
                    headers: { authorization: 'InvalidFormat' },
                    query: {},
                },
            };

            const token = (guard as any).extractToken(mockClient);

            expect(token).toBeUndefined();
        });

        it('should handle missing handshake headers', () => {
            const mockClient = {
                handshake: {
                    query: { token: 'fallback' },
                },
            };

            const token = (guard as any).extractToken(mockClient);

            expect(token).toBe('fallback');
        });
    });
});
