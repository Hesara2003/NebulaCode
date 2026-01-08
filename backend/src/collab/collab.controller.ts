import { Controller, Get } from '@nestjs/common';
import { CollaborationConfigService } from './collab.config';

@Controller('collab')
export class CollaborationController {
  constructor(private readonly config: CollaborationConfigService) {}

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      namespace: this.config.namespace,
      socketPath: this.config.socketPath,
      persistDebounceMs: this.config.persistDebounceMs,
      metricsEnabled: this.config.metricsEnabled,
      allowedOrigins: this.config.allowedOrigins.map((origin) =>
        origin instanceof RegExp ? origin.toString() : origin,
      ),
    };
  }
}
