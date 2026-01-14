import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const DEFAULT_COLLAB_NAMESPACE = 'editor-sync';
export const DEFAULT_COLLAB_SOCKET_PATH = '/editor-sync/socket.io';
export const DEFAULT_PERSIST_DEBOUNCE_MS = 750;

export function resolveAllowedOrigins(raw?: string): (string | RegExp)[] {
  const entries = (raw ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const normalized: (string | RegExp)[] = entries.map((origin) => {
    try {
      // Validate origin-like string by constructing URL

      new URL(origin);
      return origin;
    } catch {
      return origin;
    }
  });

  normalized.push(/localhost:\d+$/);
  normalized.push(/^http:\/\/127\.0\.0\.1:\d+$/);

  return normalized;
}

@Injectable()
export class CollaborationConfigService {
  private readonly logger = new Logger(CollaborationConfigService.name);

  readonly namespace: string;
  readonly socketPath: string;
  readonly persistDebounceMs: number;
  readonly metricsEnabled: boolean;
  readonly allowedOrigins: (string | RegExp)[];

  constructor(private readonly config: ConfigService) {
    this.namespace =
      this.config.get<string>('COLLAB_NAMESPACE') ?? DEFAULT_COLLAB_NAMESPACE;
    this.socketPath =
      this.config.get<string>('COLLAB_SOCKET_PATH') ??
      DEFAULT_COLLAB_SOCKET_PATH;
    this.persistDebounceMs = this.parseNumber(
      'COLLAB_PERSIST_DEBOUNCE_MS',
      DEFAULT_PERSIST_DEBOUNCE_MS,
    );
    this.metricsEnabled = this.parseBoolean('COLLAB_METRICS_ENABLED', true);
    this.allowedOrigins = resolveAllowedOrigins(
      this.config.get<string>('COLLAB_ALLOWED_ORIGINS'),
    );

    this.logSummary();
  }

  private parseNumber(key: string, fallback: number): number {
    const raw = this.config.get<string>(key);
    if (raw === undefined || raw === null || raw.trim().length === 0) {
      return fallback;
    }

    const value = Number(raw);
    if (Number.isFinite(value) && value >= 0) {
      return value;
    }

    this.logger.warn(
      `Invalid ${key} value "${raw}". Falling back to ${fallback}.`,
    );
    return fallback;
  }

  private parseBoolean(key: string, fallback: boolean): boolean {
    const raw = this.config.get<string>(key);
    if (raw === undefined || raw === null) {
      return fallback;
    }

    if (/^(1|true|yes|y)$/i.test(raw)) {
      return true;
    }
    if (/^(0|false|no|n)$/i.test(raw)) {
      return false;
    }

    this.logger.warn(
      `Invalid ${key} value "${raw}". Falling back to ${fallback}.`,
    );
    return fallback;
  }

  private logSummary(): void {
    this.logger.log(
      `Collaboration gateway configured (namespace=${this.namespace}, path=${this.socketPath}, debounce=${this.persistDebounceMs}ms, metrics=${this.metricsEnabled ? 'on' : 'off'})`,
    );
  }
}
