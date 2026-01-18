import { createLogger, createRedisClient, createPgPool } from "../shared";
import { AnalyticsEvent, AnalyticsEventSchema } from "../ingestion/schema";
import * as fs from "fs";
import * as path from "path";

const logger = createLogger("consumer-service");

// Configuration
const STREAM_NAME = "analytics_events";
const CONSUMER_GROUP = "analytics_consumers";
const CONSUMER_NAME = "consumer-1";
const BATCH_SIZE = 100;
const BLOCK_MS = 1000; // Wait 1 second for messages to accumulate
const MIN_BATCH_DELAY_MS = 100; // Minimum delay between batches to allow accumulation

interface Stats {
    totalProcessed: number;
    totalErrors: number;
    lastBatchTime: number;
    lastMonitoringTime: number;
    processedSinceLastMonitor: number;
}

const stats: Stats = {
    totalProcessed: 0,
    totalErrors: 0,
    lastBatchTime: Date.now(),
    lastMonitoringTime: Date.now(),
    processedSinceLastMonitor: 0,
}

const METRICS_FILE = path.join(__dirname, "../metrics.csv");
const MONITORING_INTERVAL_MS = 10000; // Log metrics every 10 seconds


async function processBatch(redis: any, pgPool: any, messages: any[]): Promise<void> {
    if (messages.length === 0) return;

    const batchStartTime = Date.now();
    const events: AnalyticsEvent[] = [];
    const messageIds: string[] = [];
    const invalidEvents: number[] = [];

    // Parse and validate events
    // Redis Stream format: [[messageId, [field, value, field, value, ...]]]
    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        if (!msg || msg.length < 2) continue;
        
        const messageId = msg[0];
        const fields = msg[1];
        
        try {
            // Convert [field, value, field, value] to object
            const messageData: any = {};
            for (let j = 0; j < fields.length; j += 2) {
                messageData[fields[j]] = fields[j + 1];
            }
            
            const eventData = JSON.parse(messageData.data);
            const validatedEvent = AnalyticsEventSchema.parse(eventData);
            events.push(validatedEvent);
            messageIds.push(messageId);
        } catch (error) {
            invalidEvents.push(i);
            stats.totalErrors++;
            logger.warn("Invalid event data", {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    if (events.length === 0) {
        logger.warn("No valid events in batch", {
            total: messages.length,
            invalid: invalidEvents.length,
        });
        return;
    }

    // Build parameterized INSERT query
    const values: any[] = [];
    const placeholders: string[] = [];

    events.forEach((event, idx) => {
        const offset = idx * 5;
        placeholders.push(
            `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`
        );
        values.push(
            event.timestamp,
            event.event_id,
            event.event_type,
            event.user_id,
            JSON.stringify(event.properties)
        );
    });

    const insertQuery = `
        INSERT INTO events (time, event_id, event_type, user_id, properties)
        VALUES ${placeholders.join(", ")}
        ON CONFLICT (event_id, time) DO NOTHING
    `;

    // INSERT into database with transaction
    const client = await pgPool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(insertQuery, values);
        await client.query("COMMIT");

        // Acknowledge messages in Redis after successful DB insert
        if (messageIds.length > 0) {
            await redis.xack(STREAM_NAME, CONSUMER_GROUP, ...messageIds);
        }

        stats.totalProcessed += events.length;
        stats.processedSinceLastMonitor += events.length;
        const batchTime = Date.now() - batchStartTime;
        stats.lastBatchTime = batchTime;

        logger.info('Batch processed successfully', {
            eventsProcessed: events.length,
            invalidEvents: invalidEvents.length,
            batchTimeMs: batchTime,
            totalProcessed: stats.totalProcessed,
            acknowledged: messageIds.length,
        });
    } catch (error) {
        await client.query("ROLLBACK");
        stats.totalErrors += events.length;
        logger.error("Failed to process batch", {
            error: error instanceof Error ? error.message : String(error),
            eventsCount: events.length,
        });
        // Messages NOT acknowledged will be reprocessed
    } finally {
        client.release();
    }
}


async function logMonitoringMetrics(redis: any): Promise<void> {
    const now = Date.now();
    const timeSinceLastMonitor = (now - stats.lastMonitoringTime) / 1000; // seconds
    
    // Get Redis stream length (total events in stream)
    const streamLength = await redis.xlen(STREAM_NAME);
    
    // Get consumer group info for lag calculation
    let lag = 0;
    try {
        const groupInfo = await redis.xinfo("GROUPS", STREAM_NAME);
        // groupInfo format: [['name', 'analytics_consumers', 'consumers', 1, 'pending', 0, 'lag', 71, ...]]
        for (let i = 0; i < groupInfo[0].length; i += 2) {
            if (groupInfo[0][i] === 'lag') {
                lag = groupInfo[0][i + 1];
                break;
            }
        }
    } catch (error) {
        // If no consumer group yet, lag = stream length
        lag = streamLength;
    }
    
    // Calculate processing rate
    const processingRate = stats.processedSinceLastMonitor / timeSinceLastMonitor;
    
    // Log to console
    logger.info("Monitoring metrics", {
        totalProcessed: stats.totalProcessed,
        lag: lag,
        streamLength: streamLength,
        processingRate: Math.round(processingRate * 100) / 100,
        lastBatchTimeMs: stats.lastBatchTime,
        avgEventsPerSecond: Math.round((stats.totalProcessed / ((now - stats.lastMonitoringTime + MONITORING_INTERVAL_MS) / 1000)) * 100) / 100,
    });
    
    // Write to CSV file
    const timestamp = new Date().toISOString();
    const csvLine = `${timestamp},${stats.totalProcessed},${lag},${stats.lastBatchTime},${processingRate.toFixed(2)}\n`;
    
    // Create CSV file with headers if it doesn't exist
    if (!fs.existsSync(METRICS_FILE)) {
        fs.writeFileSync(METRICS_FILE, "timestamp,events_processed,lag,batch_time_ms,processing_rate\n");
    }
    
    fs.appendFileSync(METRICS_FILE, csvLine);
    
    // Reset counters
    stats.processedSinceLastMonitor = 0;
    stats.lastMonitoringTime = now;
}


async function consumeLoop(redis: any, pgPool: any): Promise<void> {
    let lastMonitoringLog = Date.now();
    
    while (true) {
        try {
            // Read from stream using consumer group
            const results = await redis.xreadgroup(
                "GROUP",
                CONSUMER_GROUP,
                CONSUMER_NAME,
                "COUNT",
                BATCH_SIZE,
                "BLOCK",
                BLOCK_MS,
                "STREAMS",
                STREAM_NAME,
                ">"
            );

            if (results && results.length > 0) {
                const [_streamName, messages] = results[0];
                
                // Only add delay if we got fewer than batch size (allows accumulation)
                if (messages.length < BATCH_SIZE) {
                    await new Promise((resolve) => setTimeout(resolve, MIN_BATCH_DELAY_MS));
                }
                
                await processBatch(redis, pgPool, messages);
            }
            
            // Log monitoring metrics every 10 seconds
            const now = Date.now();
            if (now - lastMonitoringLog >= MONITORING_INTERVAL_MS) {
                await logMonitoringMetrics(redis);
                lastMonitoringLog = now;
            }
        } catch (error) {
            logger.error("Error in consume loop", {
                error: error instanceof Error ? error.message : String(error),
            });
            // Wait before retrying on error
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
}


async function startConsumer(): Promise<void>{
    logger.info("Starting consumer service", {
        stream: STREAM_NAME,
        group: CONSUMER_GROUP,
        consumer: CONSUMER_NAME,
        batchSize: BATCH_SIZE,
    });

    const redis = createRedisClient();
    await new Promise((resolve) => {
        redis.once("ready", resolve);
    });
    logger.info("Consumer connected to Redis successfully");

    // Connect to PostgreSQL
    const pgPool = createPgPool();
    try{
        const result = await pgPool.query('SELECT NOW()');
        logger.info("Consumer connected to PostgreSQL successfully", 
            { currentTime: result.rows[0].now }
        );

    } catch (error){
        logger.error("Failed to connect to PostgreSQL", { error });
        process.exit(1);
    }

    // Create consumer group if it doesn't exist
    try {
        await redis.xgroup("CREATE", STREAM_NAME, CONSUMER_GROUP, "0", "MKSTREAM");
        logger.info("Consumer group created", { group: CONSUMER_GROUP });
    } catch (error: any) {
        if (error.message.includes("BUSYGROUP")) {
            logger.info("Consumer group already exists", { group: CONSUMER_GROUP });
        } else {
            logger.error("Failed to create consumer group", { error });
            process.exit(1);
        }
    }

    logger.info("Consumer service ready to process events");

    // Start consuming
    consumeLoop(redis, pgPool).catch((error) => {
        logger.error("Fatal error in consume loop", { error });
        process.exit(1);
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
        logger.info("Shutting down consumer service...", {
            totalProcessed: stats.totalProcessed,
            totalErrors: stats.totalErrors,
        });
        await redis.quit();
        await pgPool.end();
        process.exit(0);
    });

    process.on("SIGTERM", async () => {
        logger.info("Shutting down consumer service...", {
            totalProcessed: stats.totalProcessed,
            totalErrors: stats.totalErrors,
        });
        await redis.quit();
        await pgPool.end();
        process.exit(0);
    });

}


// Start the service
startConsumer().catch((error) => {
    logger.error("Fatal error in consumer service", { error });
    process.exit(1);
});