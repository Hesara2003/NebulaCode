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

  constructor(private readonly configService: ConfigService) {}

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
}
