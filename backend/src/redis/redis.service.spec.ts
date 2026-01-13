import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

describe('RedisService', () => {
    let service: RedisService;
    let configService: jest.Mocked<ConfigService>;

    beforeEach(async () => {
        const mockConfigService = {
            get: jest.fn().mockReturnValue(undefined), // No REDIS_URL = fallback mode
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RedisService,
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<RedisService>(RedisService);
        configService = module.get(ConfigService);

        // Initialize the service (triggers onModuleInit)
        await service.onModuleInit();
    });

    afterEach(async () => {
        await service.onModuleDestroy();
    });

    describe('setJson and getJson', () => {
        it('should store and retrieve JSON data', async () => {
            const testData = { name: 'test', value: 123 };

            await service.setJson('test-key', testData);
            const result = await service.getJson('test-key');

            expect(result).toEqual(testData);
        });

        it('should return null for non-existent keys', async () => {
            const result = await service.getJson('non-existent-key');

            expect(result).toBeNull();
        });

        it('should handle complex nested objects', async () => {
            const complexData = {
                nested: {
                    deeply: {
                        value: 'deep',
                        array: [1, 2, 3],
                    },
                },
            };

            await service.setJson('complex-key', complexData);
            const result = await service.getJson('complex-key');

            expect(result).toEqual(complexData);
        });

        it('should overwrite existing values', async () => {
            await service.setJson('overwrite-key', { old: 'value' });
            await service.setJson('overwrite-key', { new: 'value' });

            const result = await service.getJson('overwrite-key');

            expect(result).toEqual({ new: 'value' });
        });
    });

    describe('exists', () => {
        it('should return true for existing keys', async () => {
            await service.setJson('exists-key', { data: true });

            const result = await service.exists('exists-key');

            expect(result).toBe(true);
        });

        it('should return false for non-existent keys', async () => {
            const result = await service.exists('non-existent');

            expect(result).toBe(false);
        });
    });

    describe('addToSet and getSetMembers', () => {
        it('should add members to a set', async () => {
            await service.addToSet('test-set', 'member1');
            await service.addToSet('test-set', 'member2');

            const members = await service.getSetMembers('test-set');

            expect(members).toContain('member1');
            expect(members).toContain('member2');
            expect(members).toHaveLength(2);
        });

        it('should not add duplicate members', async () => {
            await service.addToSet('dup-set', 'member1');
            await service.addToSet('dup-set', 'member1');

            const members = await service.getSetMembers('dup-set');

            expect(members).toHaveLength(1);
        });

        it('should return empty array for non-existent sets', async () => {
            const members = await service.getSetMembers('non-existent-set');

            expect(members).toEqual([]);
        });
    });

    describe('removeFromSet', () => {
        it('should remove a member from a set', async () => {
            await service.addToSet('remove-set', 'keep');
            await service.addToSet('remove-set', 'remove');

            await service.removeFromSet('remove-set', 'remove');

            const members = await service.getSetMembers('remove-set');
            expect(members).toEqual(['keep']);
        });

        it('should handle removing from non-existent set gracefully', async () => {
            await expect(
                service.removeFromSet('non-existent', 'member')
            ).resolves.not.toThrow();
        });

        it('should handle removing non-existent member gracefully', async () => {
            await service.addToSet('partial-set', 'exists');

            await expect(
                service.removeFromSet('partial-set', 'not-exists')
            ).resolves.not.toThrow();

            const members = await service.getSetMembers('partial-set');
            expect(members).toContain('exists');
        });
    });

    describe('delete', () => {
        it('should delete an existing key', async () => {
            await service.setJson('delete-key', { data: true });

            await service.delete('delete-key');

            const exists = await service.exists('delete-key');
            expect(exists).toBe(false);
        });

        it('should handle deleting non-existent keys gracefully', async () => {
            await expect(service.delete('non-existent')).resolves.not.toThrow();
        });
    });

    describe('onModuleInit (fallback mode)', () => {
        it('should use in-memory store when REDIS_URL is not configured', async () => {
            // The service is already initialized with no REDIS_URL
            // Verify it works with the fallback store
            await service.setJson('fallback-test', { fallback: true });
            const result = await service.getJson('fallback-test');

            expect(result).toEqual({ fallback: true });
        });
    });
});
