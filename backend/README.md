# Backend Services

The backend consists of three TypeScript microservices that handle event ingestion, processing, and data access.

## Services

### 1. API Service (`/api`)
REST API server that provides endpoints for querying analytics data.

**Status:** Complete

**Responsibilities:**
- Expose HTTP endpoints for data queries
- Serve aggregated metrics from TimescaleDB continuous aggregates
- Provide real-time and historical metrics
- In-memory caching for performance

**Key Features:**
- 4 REST endpoints (health, summary, realtime, hourly, recent events)
- Response times: 5-38ms (target < 300ms)
- Caching with 5-10s TTL
- CORS enabled for frontend (localhost:5173)
- Request logging with duration tracking

**Port:** `3001`

See [api/README.md](api/README.md) for detailed documentation.

### 2. Consumer Service (`/consumer`)
Event processing service that reads from Redis Stream and writes to TimescaleDB.

**Status:** Complete

**Responsibilities:**
- Consume events from Redis Stream using consumer groups
- Batch process events for cost efficiency
- Validate event data using Zod schemas
- Write processed events to TimescaleDB in transactions
- Track performance metrics and lag
- Handle errors with transaction rollback

**Key Features:**
- Batch size: 100 events
- Processing rate: 26-28 events/sec sustained
- Lag monitoring every 10 seconds
- Metrics export to CSV file
- At-least-once delivery semantics

See [consumer/README.md](consumer/README.md) for detailed documentation.

### 3. Ingestion Service (`/ingestion`)
Event generator that simulates real-world analytics events.

**Status:** Complete

**Responsibilities:**
- Generate realistic event data using predefined templates
- Publish events to Redis Stream at configurable rates
- Support burst mode for load testing
- Monitor publishing performance

**Key Features:**
- 4 event types: page_view, button_click, api_call, error
- Configurable rate: 28 events/sec (100K/hour)
- Burst mode: 10x rate for 30 seconds every 5 minutes
- Weighted distribution: 70% page views, 15% clicks, 10% API calls, 5% errors
- Redis Stream publication with automatic stream creation

See [ingestion/README.md](ingestion/README.md) for detailed documentation.

## Shared Modules (`/shared`)

Common utilities and configurations used across all services:

### `env.ts`
- Loads and validates environment variables using Zod
- Ensures type safety for configuration values
- Throws errors if required variables are missing

### `config.ts`
- Creates Redis client connections
- Creates PostgreSQL connection pools
- Exports reusable database clients

### `logger.ts`
- Structured JSON logging
- Service-specific loggers
- Log levels: info, warn, error, debug

## Development

### Install Dependencies

# Ingestion Service Configuration
EVENTS_PER_SECOND=28
BURST_MULTIPLIER=10
BURST_INTERVAL_MS=300000
BURST_DURATION_MS=30000
```bash
npm install
```

### Environment Setup
Create a `.env` file in the backend directory:
```env
REDIS_URL=redis://localhost:6379
POSTGRES_URL=postgresql://analytics_user:analytics_pass@localhost:5432/analytics
API_PORT=3001
NODE_ENV=development
```  # Coming soon
```

**Consumer Service:**
```bash
npm run consumer  # Processes events from Redis to database
```

**Ingestion Service:**
```bash
npm run ingestion  # Generates and publishes events
```

### Running the Full Pipeline

1. Start Docker containers (Redis + TimescaleDB):
   ```bash
   cd infra
   docker-compose up -d
   ```

2. Start consumer service (Terminal 1):
   ```bash
   cd backend
   npm run consumer
   ```

3. Start ingestion service (Terminal 2):
   ```bash
   cd backend
   npm run ingestion
   ```

4. Monitor metrics:
   ```bash
   # Check event stream length
   docker exec -it analytics-redis redis-cli XLEN analytics_events
   
   # Check database count
   docker exec -it analytics-timescaledb psql -U analytics_user -d analytics -c "SELECT COUNT(*) FROM events;"
   
   # View performance metrics
   cat backend/metrics.csv
   npm run dev
```

**Consumer Service:**
```bash
npm run consumer
```

**Ingestion Service:**
```bash
npm run ingestion
```

## Database Connections

### Redis
Used for event streaming via Redis Streams.
- Connection handled by `ioredis` library
- Automatic reconnection with exponential backoff
- Health checks included

### PostgreSQL/TimescaleDB
Used for persistent time-series data storage.
- Connection pooling via `pg` library
- Pool size: 20 connections
- Connection timeout: 2 seconds
- Idle timeout: 30 seconds

## TypeScript Configuration

The project uses TypeScript with the following settings:
- Target: ES2020
- Module: CommonJS
- Strict mode enabled
- Source maps for debugging

## Code Structure

```
backend/
├── api/
│   └── index.ts          # API entry point
├── consumer/
│   └── index.ts          # Consumer entry point
├── ingestion/
│   └── index.ts          # Ingestion entry point
├── shared/
│   ├── config.ts         # Database configurations
│   ├── env.ts            # Environment validation
│   ├── logger.ts         # Logging utility
│   └── index.ts          # Shared exports
├── package.json
├── tsconfig.json
└── .env
```

## Key Dependencies

- **express** - Web framework for API service
- **ioredis** - Redis client for streaming
- **pg** - PostgreSQL client
- **ws** - WebSocket support
- **zod** - Schema validation
- **dotenv** - Environment variable loading

## Development Tools

- **ts-node** - Execute TypeScript directly
- **nodemon** - Auto-restart on file changes
- **typescript** - TypeScript compiler

## Testing Connections

The API service automatically tests database connections on startup:
```bash
npm run dev
```

Expected output:
```
Redis connected successfully.
PostgreSQL connected successfully.
All database connections successful.
```

## Error Handling

All services implement graceful shutdown:
- SIGINT/SIGTERM handlers
- Database connection cleanup
- Proper resource disposal

## Next Steps

1. Implement event schema definitions
2. Build ingestion service event generator
3. Develop consumer service processing logic
4. Create API endpoints for data access
5. Add comprehensive error handling
6. Implement monitoring and metrics
