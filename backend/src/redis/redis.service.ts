import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Small wrapper around Redis that automatically falls back to
 * an in-memory Map when Redis is unavailable. This keeps the
 * rest of the codebase agnostic to the storage layer.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly fallbackStore = new Map<string, string>();

  constructor(private readonly configService: ConfigService) { }

  async onModuleInit(): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      this.logger.warn(
        'REDIS_URL is not configured. Using in-memory run store.',
      );
      return;
    }

    try {
      const client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });
      await client.connect();
      this.client = client;
      this.logger.log('Connected to Redis.');
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to connect to Redis. Falling back to in-memory store: ${err.message}`,
        err.stack,
      );
      this.client?.disconnect();
      this.client = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  async setJson<T>(key: string, value: T): Promise<void> {
    const serialised = JSON.stringify(value);
    if (this.client) {
      await this.client.set(key, serialised);
    } else {
      this.fallbackStore.set(key, serialised);
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const payload = this.client
      ? await this.client.get(key)
      : this.fallbackStore.get(key);
    if (!payload) {
      return null;
    }
    return JSON.parse(payload) as T;
  }

  async exists(key: string): Promise<boolean> {
    if (this.client) {
      const result = await this.client.exists(key);
      return result === 1;
    }
    return this.fallbackStore.has(key);
  }

  /**
   * Add a member to a set (SADD).
   */
  async addToSet(key: string, member: string): Promise<void> {
    if (this.client) {
      await this.client.sadd(key, member);
    } else {
      const existing = this.fallbackStore.get(key);
      const set = existing
        ? new Set<string>(JSON.parse(existing))
        : new Set<string>();
      set.add(member);
      this.fallbackStore.set(key, JSON.stringify([...set]));
    }
  }

  /**
   * Remove a member from a set (SREM).
   */
  async removeFromSet(key: string, member: string): Promise<void> {
    if (this.client) {
      await this.client.srem(key, member);
    } else {
      const existing = this.fallbackStore.get(key);
      if (existing) {
        const set = new Set<string>(JSON.parse(existing));
        set.delete(member);
        this.fallbackStore.set(key, JSON.stringify([...set]));
      }
    }
  }

  /**
   * Get all members of a set (SMEMBERS).
   */
  async getSetMembers(key: string): Promise<string[]> {
    if (this.client) {
      return this.client.smembers(key);
    } else {
      const existing = this.fallbackStore.get(key);
      return existing ? JSON.parse(existing) : [];
    }
  }

  /**
   * Delete a key.
   */
  async delete(key: string): Promise<void> {
    if (this.client) {
      await this.client.del(key);
    } else {
      this.fallbackStore.delete(key);
    }
  }

  /* ============ Distributed Locking ============ */

  private readonly activeLocks = new Map<string, string>();

  /**
   * Acquire a distributed lock using Redis SET NX EX pattern.
   * Returns a unique token if lock acquired, null otherwise.
   * @param key - Lock key
   * @param ttlMs - Lock timeout in milliseconds (auto-release after this)
   */
  async acquireLock(key: string, ttlMs: number): Promise<string | null> {
    const token = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const lockKey = `lock:${key}`;
    const ttlSeconds = Math.ceil(ttlMs / 1000);

    if (this.client) {
      // Redis: SET key token NX EX ttl (atomic)
      const result = await this.client.set(lockKey, token, 'EX', ttlSeconds, 'NX');
      if (result === 'OK') {
        this.logger.debug(`Lock acquired: ${lockKey}`);
        return token;
      }
      return null;
    } else {
      // In-memory fallback
      if (this.activeLocks.has(lockKey)) {
        return null; // Lock already held
      }
      this.activeLocks.set(lockKey, token);
      // Auto-release after TTL
      setTimeout(() => {
        if (this.activeLocks.get(lockKey) === token) {
          this.activeLocks.delete(lockKey);
          this.logger.debug(`Lock auto-released (TTL): ${lockKey}`);
        }
      }, ttlMs);
      this.logger.debug(`Lock acquired (in-memory): ${lockKey}`);
      return token;
    }
  }

  /**
   * Release a distributed lock. Only releases if we own it (token matches).
   * @param key - Lock key
   * @param token - Token received from acquireLock
   */
  async releaseLock(key: string, token: string): Promise<boolean> {
    const lockKey = `lock:${key}`;

    if (this.client) {
      // Lua script to atomically check-and-delete
      const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      const result = await this.client.eval(luaScript, 1, lockKey, token);
      const released = result === 1;
      if (released) {
        this.logger.debug(`Lock released: ${lockKey}`);
      }
      return released;
    } else {
      // In-memory fallback
      if (this.activeLocks.get(lockKey) === token) {
        this.activeLocks.delete(lockKey);
        this.logger.debug(`Lock released (in-memory): ${lockKey}`);
        return true;
      }
      return false;
    }
  }

  /**
   * Execute a function while holding a distributed lock.
   * Automatically acquires and releases the lock.
   * @param key - Lock key
   * @param ttlMs - Lock timeout in milliseconds
   * @param fn - Function to execute while holding lock
   * @param retryAttempts - Number of retry attempts if lock not acquired
   * @param retryDelayMs - Delay between retries
   */
  async withLock<T>(
    key: string,
    ttlMs: number,
    fn: () => Promise<T>,
    retryAttempts = 3,
    retryDelayMs = 100,
  ): Promise<T> {
    let token: string | null = null;
    let attempts = 0;

    // Try to acquire lock with retries
    while (!token && attempts < retryAttempts) {
      token = await this.acquireLock(key, ttlMs);
      if (!token) {
        attempts++;
        if (attempts < retryAttempts) {
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        }
      }
    }

    if (!token) {
      throw new Error(`Failed to acquire lock: ${key} after ${retryAttempts} attempts`);
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(key, token);
    }
  }
}
