import express, { Request, Response, NextFunction } from "express";
import { createLogger } from "../shared";
import { pool } from "./db";
import { cache } from "./cache";
import { env } from "../shared";
import cors from "cors";

const logger = createLogger("api-service");
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173', // Where my react application will run
    credentials: true,
}));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('HTTP REQUEST', {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: `${duration}ms`
        });
    });
    next();
});

// Cache middleware factory
function withCache(key: string, ttlSeconds: number) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const cacheKey = `${key}:${JSON.stringify(req.query)}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            logger.debug("Cache HIT", { key: cacheKey });
            return res.json(cached);
        }

        logger.debug("Cache MISS", { key: cacheKey });

        // Store original from json method
        const originalJson = res.json.bind(res);

        // Override json method to cache response
        res.json = function(data: any) {
            cache.set(cacheKey, data, ttlSeconds);
            return originalJson(data);
        };

        next();
    };
}

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Endpoint 1: GET /metrics/realtime
// Returns last 5 minutes of data in 10-second buckets
app.get('/metrics/realtime', withCache('realtime', 5), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await pool.query(`
            SELECT
                time_bucket('10 seconds', time) AS timestamp,
                event_type,
                COUNT(*) as count
            FROM events
            WHERE time > NOW() - INTERVAL '5 minutes'
            GROUP BY timestamp, event_type
            ORDER BY timestamp DESC, event_type
        `);

        // Transform into nested structure
        const buckets = new Map<string, any>();

        result.rows.forEach(row => {
            const ts = row.timestamp.toISOString();
            if(!buckets.has(ts)) {
                buckets.set(ts, { timestamp: ts, counts: {} });
            }
            buckets.get(ts).counts[row.event_type] = parseInt(row.count);
        });

        const bucketsArray = Array.from(buckets.values());
        const totalEvents = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
        const eventsPerSecond = totalEvents / 300; // 300s is 5 minutes

        res.json({
            timeRange: '5m',
            buckets: bucketsArray,
            summary: {
                total_events: totalEvents,
                eventsPerSecond: parseFloat(eventsPerSecond.toFixed(2))
            }
        })
    } catch (error) {
        next(error);
    }
});

// Endpoint 2: GET /metrics/hourly
// Returns last 24 hours in 1-hour buckets
app.get("/metrics/hourly", withCache("hourly", 5), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await pool.query(`
            SELECT
                bucket as timestamp,
                event_type,
                event_count as count
            FROM events_per_hour
            WHERE bucket > NOW() - INTERVAL '24 hours'
            ORDER BY bucket DESC, event_type
        `);

        // Transform into nested structure again like previously
        const buckets = new Map<string, any>();

        result.rows.forEach(row => {
            const ts = row.timestamp.toISOString();
            if (!buckets.has(ts)) {
                buckets.set(ts, { timestamp: ts, counts: {} });
            }
            buckets.get(ts).counts[row.event_type] = parseInt(row.count);
        });

        const bucketsArray = Array.from(buckets.values());
        const totalEvents = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);

        res.json({
            timeRange: '24h',
            buckets: bucketsArray,
            summary: {
                total_events: totalEvents,
                events_per_second: parseFloat((totalEvents / 86400).toFixed(2)) //86400 is secs in a day
            }
        });
    } catch (error) {
        next(error);
    }
});

// Endpoint 3: GET /metrics/summary
// Returns high-level stats for dashboard cards
app.get("/metrics/summary", withCache('summary', 10), async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Total events last hour (from materialized view)
        const totalResult = await pool.query(`
            SELECT SUM(event_count) as total
            FROM events_per_minute
            WHERE bucket > NOW() - INTERVAL '1 hour'
        `);

        // Events per second (last hour)
        const totalEvents = parseInt(totalResult.rows[0].total || 0)
        const eventsPerSecond = totalEvents / 3600;

        // Top events by type (last hour)
        const topEventsResult = await pool.query(`
            SELECT
                event_type as type, 
                SUM(event_count) as count
            FROM events_per_minute
            WHERE bucket > NOW() - INTERVAL '1 hour'
            GROUP BY event_type
            ORDER BY count DESC
            LIMIT 3
        `);

        // Unique users (must query raw table)
        const uniqueUsersResult = await pool.query(`
            SELECT COUNT(DISTINCT user_id) as count
            FROM events
            WHERE time > NOW() - INTERVAL '1 hour'
        `);

        res.json({
            last_hour: {
                total_events: totalEvents,
                unique_users: parseInt(uniqueUsersResult.rows[0].count),
                events_per_second: parseFloat(eventsPerSecond.toFixed(2)),
                top_events: topEventsResult.rows.map(row => ({
                    type: row.type,
                    count: parseInt(row.count)
                }))
            }
        });
    } catch(error) {
        next(error);
    }
});

// Endpoint 4: GET /events/recent
// Returns last N events from database
app.get("/events/recent", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

        if (limit > 100) {
            return res.status(400).json({
                error: "Limit cannot exceed 100",
                max_limit: 100
            });
        }

        const result = await pool.query(`
            SELECT event_id, event_type, user_id, time, properties
            FROM events
            ORDER BY time DESC
            LIMIT $1
        `, [limit]);

        res.json({
            events: result.rows,
            count: result.rows.length,
            limit: limit
        });
    } catch (error){
        next(error);
    }
});

// Error handling middleware (must be after all routes)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('API error', {
        error: err.message,
        stack: err.stack,
        path: req.path
    });

    res.status(500).json({
        error: "Internal Server Error",
        message: err.message
    });
});

// Start server
const PORT = env.API_PORT;
app.listen(PORT, () => {
    logger.info(`API server listening on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await pool.end();
    process.exit(0);
});