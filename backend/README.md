# Backend Services

The backend consists of three TypeScript microservices that handle event ingestion, processing, and data access.

## Services

### 1. API Service (`/api`)
REST API server that provides endpoints for querying analytics data.

**Responsibilities:**
- Expose HTTP endpoints for data queries
- Serve aggregated metrics from TimescaleDB
- Provide WebSocket connections for real-time updates

**Port:** `3001`

### 2. Consumer Service (`/consumer`)
Event processing service that reads from Redis Stream and writes to TimescaleDB.

**Responsibilities:**
- Consume events from Redis Stream
- Process and validate event data
- Write processed events to TimescaleDB
- Handle backpressure and error recovery

### 3. Ingestion Service (`/ingestion`)
Event generator that simulates real-world analytics events.

**Responsibilities:**
- Generate realistic event data
- Publish events to Redis Stream
- Control event rate and volume
- Simulate various event types

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
```

### Run Services

**API Service:**
```bash
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
