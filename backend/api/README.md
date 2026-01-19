# API Service

The API service provides REST endpoints for querying analytics data from TimescaleDB with caching for optimal performance.

## Status

**Complete** - All endpoints implemented and tested

## Endpoints

### Health Check
```
GET /health
Returns: { status: 'ok', timestamp: '...' }
Response Time: < 5ms
```

### Summary Metrics
```
GET /metrics/summary
Cache: 10 seconds
Returns: Last hour statistics (total events, unique users, events/sec, top events)
Response Time: ~38ms
```

### Realtime Metrics
```
GET /metrics/realtime
Cache: 5 seconds
Returns: Last 5 minutes in 10-second buckets
Response Time: ~24ms
```

### Hourly Metrics
```
GET /metrics/hourly
Cache: 5 seconds
Returns: Last 24 hours in 1-hour buckets (uses events_per_hour view)
Response Time: ~24ms
```

### Recent Events
```
GET /events/recent?limit=50
No Cache: Always fresh data
Returns: Last N events (max 100)
Response Time: ~5ms
```

## Features

### Caching
- Simple in-memory cache with TTL
- Logs show Cache HIT/MISS for monitoring
- Configurable TTL per endpoint

### Performance
- All endpoints respond under 300ms requirement
- Actual response times: 5-38ms
- Uses TimescaleDB continuous aggregates for fast queries

### Error Handling
- Centralized error middleware
- Proper HTTP status codes
- JSON error responses

### CORS
- Configured for frontend at localhost:5173
- Credentials support enabled

## Configuration

Environment variables (from backend/.env):
- `API_PORT`: HTTP server port (default: 3001)
- `POSTGRES_URL`: Database connection string

## Files

- `index.ts`: Express server with all endpoints
- `db.ts`: PostgreSQL connection pool
- `cache.ts`: Simple in-memory cache implementation

## Running

```bash
cd backend
npm run dev
```

Server starts on port 3001. Access health check at http://localhost:3001/health
