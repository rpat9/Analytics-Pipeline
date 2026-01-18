import { parse } from "node:path";
import { createLogger, createRedisClient } from "../shared";
import { generateEvent } from "./generator";
import { AnalyticsEventSchema } from "./schema";
import { stat } from "node:fs";
import { set } from "zod";

const logger = createLogger("ingestion-service");

// Configuration from environment
const EVENTS_PER_SECOND = parseInt(process.env.EVENTS_PER_SECOND || "10");
const BURST_MULTIPLIER = parseInt(process.env.BURST_MULTIPLIER || "10");
const BURST_INTERVAL_MS = parseInt(process.env.BURST_INTERVAL_MS || "300000"); // 5 minutes
const BURST_DURATION_MS = parseInt(process.env.BURST_DURATION_MS || "30000"); // 30 seconds

const STREAM_NAME = 'analytics_events';
const LOG_INTERVAL = 100; // Log every 100 events

// Statistics Tracking
interface Stats {
    totalEvents: number;
    eventsSinceLastLog: number;
    lastLogTime: number;
    errors: number;
    currentRate: number;
    isBurstMode: boolean;
}

const stats: Stats = {
    totalEvents: 0,
    eventsSinceLastLog: 0,
    lastLogTime: Date.now(),
    errors: 0,
    currentRate: EVENTS_PER_SECOND,
    isBurstMode: false,
}

async function logProgress(redis: any): Promise<void> {
    const now = Date.now();
    const timeSinceLastLog = (now - stats.lastLogTime) / 1000; // in seconds
    const actualRate = Math.round(LOG_INTERVAL / timeSinceLastLog);

    // Get Redis stream length
    let streamLength = 0;
    try {
        streamLength = await redis.xlen(STREAM_NAME);
    } catch (error) {
        logger.warn('Failed to get stream length', { error });
    }

    logger.info('Progress Update', {
        totalEvents: stats.totalEvents,
        streamLength,
        targetRate: stats.currentRate,
        actualRate,
        errors: stats.errors,
        burstMode: stats.isBurstMode,
    });

    stats.lastLogTime = now;
}

async function publishEvent(redis: any): Promise<void> {
    try{
        // Generate Event
        const event = generateEvent();

        // Validate Event
        const validatedEvent = AnalyticsEventSchema.parse(event);

        // Publish to Redis Stream
        await redis.xadd(
            STREAM_NAME,
            '*', // Auto-generated ID
            'data',
            JSON.stringify(validatedEvent)
        );

        // Update statistics
        stats.totalEvents++;
        stats.eventsSinceLastLog++;

        // Log progress every LOG_INTERVAL events
        if (stats.eventsSinceLastLog >= LOG_INTERVAL) {
            await logProgress(redis);
            stats.eventsSinceLastLog = 0;
        }
    } catch (error) {
        stats.errors++;
        logger.error('Failed to publish event', {
            error: error instanceof Error ? error.message : String(error),
        });
    }
}

function calculateDelay(eventsPerSecond: number): number {
    return Math.floor(1000 / eventsPerSecond);
}

async function startIngestion(): Promise<void> {
    logger.info('Starting ingestion service', {
        eventsPerSecond: EVENTS_PER_SECOND,
        burstMultiplier: BURST_MULTIPLIER,
        burstInterval: `${BURST_INTERVAL_MS / 1000}s`,
        burstDuration: `${BURST_DURATION_MS / 1000}s`,
    });

    // Connect to Redis
    const redis = createRedisClient();

    // Wait for Redis connection
    await new Promise((resolve) => {
        redis.on('ready', resolve);
    });

    logger.info('Connected to Redis, starting event generation');

    // Setup burst mode scheduler
    setInterval(() => {
        if (!stats.isBurstMode) {
            logger.info('BURST MODE ACTIVATED', {
                multiplier: BURST_MULTIPLIER,
                duration: `${BURST_DURATION_MS / 1000}s`,
            });

            stats.isBurstMode = true;
            stats.currentRate = EVENTS_PER_SECOND * BURST_MULTIPLIER;

            // End burst mode after duration
            setTimeout(() => {
                stats.isBurstMode = false;
                stats.currentRate = EVENTS_PER_SECOND;
                logger.info('BURST MODE DEACTIVATED - returning to normal rate', {
                    normalRate: EVENTS_PER_SECOND,
                });
            }, BURST_DURATION_MS);
        }
    }, BURST_INTERVAL_MS);

    // Main even generation loop
    async function generateLoop() {
        while (true) {
            const delay = calculateDelay(stats.currentRate);
            await publishEvent(redis);
            await new Promise(res => setTimeout(res, delay));
        }
    }

    generateLoop().catch((error) => {
        logger.error('Fatal error in generation loop', { error });
        process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
        logger.info('Shutting down gracefully');
        await logProgress(redis);
        await redis.quit();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        logger.info('Shutting down gracefully');
        await logProgress(redis);
        await redis.quit();
        process.exit(0);
    });
}

// Start the service
startIngestion().catch((error) => {
    logger.error('Failed to start ingestion service', { error });
    process.exit(1);
});