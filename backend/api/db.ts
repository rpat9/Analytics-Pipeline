import { createPgPool } from "../shared";
import { createLogger } from "../shared";

const logger = createLogger("api-db");

// Create PostgreSQL pool for API queries
export const pool = createPgPool();

// Test connection on startup
pool.connect()
    .then(client => {
        logger.info("Database connection established");
        client.release();
    })
    .catch(err => {
        logger.error("Error connection to the database", { error: err});
        process.exit(1);
    });

process.on("SIGTERM", async () => {
    logger.info("SIGTERM received, closing database pool");
    await pool.end();
    process.exit(0);
});

process.on("SIGINT", async () => {
    logger.info("SIGINT received, closing database pool");
    await pool.end();
    process.exit(0);
});