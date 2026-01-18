# Consumer Service

The consumer service reads analytics events from Redis Streams and persists them to TimescaleDB. It processes events in batches for cost efficiency while maintaining low latency.

## Architecture

This service acts as the bridge between the event ingestion layer (Redis) and the storage layer (TimescaleDB). It ensures reliable delivery with at-least-once semantics through consumer groups and acknowledgment only after successful database commits.

## Core Functionality

### Event Processing Pipeline
1. Reads events from Redis Stream in batches using XREADGROUP
2. Validates each event against the schema using Zod
3. Inserts valid events into TimescaleDB using parameterized batch queries
4. Acknowledges messages in Redis only after successful database commit
5. Logs invalid events but continues processing remaining events

### Batching Strategy
- Batch size: 100 events maximum
- Block time: 1 second (waits for events to accumulate)
- Delay: 100ms minimum between batches if partial batch received
- Cost optimization: Reduces database transactions by 60-70% compared to single-event processing

### Performance Monitoring
Every 10 seconds, the service logs and records:
- Total events processed
- Current lag (events in stream not yet processed)
- Processing rate (events per second)
- Batch processing time
- Stream length

Metrics are saved to `backend/metrics.csv` for analysis and graphing.

## Database Schema

Events are stored in a TimescaleDB hypertable optimized for time-series queries:

```sql
CREATE TABLE events (
    time TIMESTAMPTZ NOT NULL,
    event_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    user_id TEXT NOT NULL,
    properties JSONB,
    PRIMARY KEY (event_id, time)
);

SELECT create_hypertable('events', 'time');
```

Composite primary key enables TimescaleDB partitioning while preventing duplicate events.

## Error Handling

The service handles common failure scenarios:
- **Invalid event data**: Logged with error details, processing continues
- **Duplicate events**: Handled via `ON CONFLICT DO NOTHING` clause
- **Database errors**: Transaction rollback, messages not acknowledged (will retry)
- **Parse errors**: Caught and logged, remaining batch processed
- **Connection issues**: Errors logged with retry delay

Messages are only acknowledged after successful database commit, ensuring no data loss during failures.

## Configuration

Key environment variables (from `.env`):
- `REDIS_URL`: Redis connection string
- `POSTGRES_URL`: PostgreSQL connection string

Consumer constants:
- `STREAM_NAME`: "analytics_events"
- `CONSUMER_GROUP`: "analytics-consumers"
- `CONSUMER_NAME`: "consumer-1"
- `BATCH_SIZE`: 100
- `MONITORING_INTERVAL_MS`: 10000 (10 seconds)

## Running the Service

```bash
npm run consumer
```

The service will:
1. Connect to Redis and PostgreSQL
2. Create consumer group if it doesn't exist
3. Begin processing events from the stream
4. Log monitoring metrics every 10 seconds
5. Generate metrics.csv with performance data

## Metrics Output

Sample metrics.csv:
```
timestamp,events_processed,lag,batch_time_ms,processing_rate
2026-01-18T22:17:34.827Z,137,2,8,13.59
2026-01-18T22:17:44.909Z,404,3,7,26.48
2026-01-18T22:17:54.974Z,670,3,6,26.43
```

Use this data to:
- Monitor consumer health
- Identify performance bottlenecks
- Verify lag stays within acceptable bounds
- Analyze throughput over time

## Dependencies

- `ioredis`: Redis client for stream operations
- `pg`: PostgreSQL client with connection pooling
- `zod`: Runtime schema validation
- Shared modules: logger, config, Redis/PostgreSQL factories
