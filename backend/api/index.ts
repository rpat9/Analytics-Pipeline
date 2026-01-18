import { createLogger, createRedisClient, createPgPool } from "../shared";

const logger = createLogger('api-service');

async function startApiService() {
    logger.info('Starting API service...');

    // Test Redis Connection
    const redis = createRedisClient();
    try {
        await redis.ping();
        logger.info('Redis connection test: SUCCESS');
    } catch (error) {
        logger.error('Redis connection test: FAILED', { error });
        process.exit(1);
    }

    // Test PostgreSQL Connection
    const pgPool = createPgPool();
    try {
        const result = await pgPool.query('SELECT NOW()');
        logger.info('PostgreSQL connection test: SUCCESS', { 
            currentTime: result.rows[0].now 
        });
    } catch (error) {
        logger.error('PostgreSQL connection test: FAILED', { error });
        process.exit(1);
    }

    logger.info('All database connections successful. API service is running.');

    // Keep the process running
    process.on('SIGINT', async () => {
        logger.info('Shutting down API service...');
        await redis.quit();
        await pgPool.end();
        logger.info('API service shut down complete.');
        process.exit(0);
    });
}

startApiService().catch((error) => {
    logger.error('Failed to start API service', { error });
    process.exit(1);
});