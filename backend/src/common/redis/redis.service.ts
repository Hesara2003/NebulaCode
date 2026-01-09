import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private client: Redis;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        this.client = new Redis({
            host: this.configService.get('REDIS_HOST'),
            port: this.configService.get('REDIS_PORT'),
            lazyConnect: true,
        });
    }

    onModuleDestroy() {
        if (this.client) {
            this.client.disconnect();
        }
    }

    getClient(): Redis {
        return this.client;
    }
}
