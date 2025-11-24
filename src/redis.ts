import { Redis } from 'ioredis';

// Simple Redis connection singleton. Configure via env vars if needed.
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const redis = new Redis(redisUrl);
