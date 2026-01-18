# Shared Modules

Common utilities and configurations used across all backend services.

## Overview

This directory contains shared code that ensures consistency across the API, Consumer, and Ingestion services. All three services import from this module for database connections, logging, and environment configuration.

## Modules

### env.ts

Loads and validates environment variables using Zod schemas.

**Features:**
- Validates required environment variables at startup
- Type-safe environment access
- Fails fast with clear error messages if configuration is invalid

**Usage:**
```typescript
import { env } from '../shared';
console.log(env.REDIS_URL);
```

### config.ts

Factory functions for creating database client connections.

**Exports:**
- `createRedisClient()` - Creates configured ioredis client with retry logic
- `createPgPool()` - Creates PostgreSQL connection pool
- `env` - Re-exports environment variables for convenience

**Features:**
- Automatic reconnection with exponential backoff
- Connection event logging
- Error handling and monitoring
- Optimized connection pool settings

**Usage:**
```typescript
import { createRedisClient, createPgPool } from '../shared';

const redis = createRedisClient();
const pgPool = createPgPool();
```

### logger.ts

Structured JSON logging utility.

**Features:**
- Service-specific logger instances
- JSON-formatted output for log aggregation
- Multiple log levels (info, warn, error, debug)
- Timestamp and service name automatically included
- Optional data objects for context

**Usage:**
```typescript
import { createLogger } from '../shared';

const logger = createLogger('my-service');
logger.info('Service started');
logger.error('Connection failed', { error: err });
```

**Log Format:**
```json
{
  "timestamp": "2026-01-18T18:48:55.943Z",
  "service": "my-service",
  "level": "INFO",
  "message": "Service started",
  "data": {}
}
```

### index.ts

Barrel export file that re-exports all shared modules for convenient importing.

**Usage:**
```typescript
import { env, createRedisClient, createPgPool, createLogger } from '../shared';
```

## Environment Variables

Required variables (validated by env.ts):

```env
REDIS_URL=redis://localhost:6379
POSTGRES_URL=postgresql://user:password@localhost:5432/analytics
API_PORT=3001
NODE_ENV=development
```

## Design Principles

1. **DRY** - Database connection logic written once, used everywhere
2. **Type Safety** - Full TypeScript support with validated types
3. **Fail Fast** - Invalid configuration detected at startup, not runtime
4. **Observability** - Structured logging for all services
5. **Reliability** - Built-in retry logic and error handling
