import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redis: RedisClientType;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.redis = createClient({
        socket: {
          host: this.configService.get('REDIS_HOST', 'localhost'),
          port: this.configService.get('REDIS_PORT', 6379),
        },
        password: this.configService.get('REDIS_PASSWORD'),
      });

      this.redis.on('error', (err) => {
        this.logger.error('Redis Client Error', err);
      });

      this.redis.on('connect', () => {
        this.logger.log('Redis connected successfully');
      });

      await this.redis.connect();
      this.logger.log('Redis service initialized');
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.disconnect();
      this.logger.log('Redis disconnected');
    }
  }

  async addToBlacklist(token: string, expiresIn: number): Promise<void> {
    try {
      await this.redis.setEx(`blacklist:${token}`, expiresIn, '1');
      this.logger.log(`Token added to blacklist with TTL ${expiresIn}s`);
    } catch (error) {
      this.logger.error('Failed to add token to blacklist', error);
      throw error;
    }
  }

  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(`blacklist:${token}`);
      return exists === 1;
    } catch (error) {
      this.logger.error('Failed to check blacklist', error);
      return false;
    }
  }

  async storeGithubToken(
    githubId: string,
    accessToken: string,
    ttl: number = 604800,
  ): Promise<void> {
    try {
      await this.redis.setEx(`github:token:${githubId}`, ttl, accessToken);
      this.logger.log(`GitHub token stored for ${githubId} with TTL ${ttl}s`);
    } catch (error) {
      this.logger.error('Failed to store GitHub token', error);
      throw error;
    }
  }

  async getGithubToken(githubId: string): Promise<string | null> {
    try {
      return await this.redis.get(`github:token:${githubId}`);
    } catch (error) {
      this.logger.error('Failed to get GitHub token', error);
      return null;
    }
  }

  async deleteGithubToken(githubId: string): Promise<void> {
    try {
      await this.redis.del(`github:token:${githubId}`);
      this.logger.log(`GitHub token deleted for ${githubId}`);
    } catch (error) {
      this.logger.error('Failed to delete GitHub token', error);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setEx(key, ttl, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  getClient(): RedisClientType {
    return this.redis;
  }
}
