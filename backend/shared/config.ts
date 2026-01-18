import { env } from "./env";
import Redis from "ioredis";
import { Pool } from 'pg';

// Redis configuration
export const createRedisClient = () => {
    const redis = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        }
    });

    redis.on('connect', () => {
        console.log("Redis connected successfully");
    });

    redis.on('error', (err) => {
        console.log("Redis connection error:", err.message);
    });

    return redis;
};

// PostgreSQL configuration
export const createPgPool = () => {
    const pool = new Pool({
        connectionString: env.POSTGRES_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });

    pool.on('connect', () => {
        console.log("PostgreSQL connected successfully");
    });

    pool.on('error', (err) => {
        console.log("PostgreSQL pool error:", err.message);
    });

    return pool;
};