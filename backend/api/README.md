# API Service

The API service provides HTTP and WebSocket endpoints for querying analytics data from TimescaleDB and streaming real-time events.

## Status

This service is currently a placeholder and will be implemented in future development phases.

## Planned Functionality

### HTTP Endpoints (REST API)
- `GET /events`: Query events with filters (time range, event type, user)
- `GET /events/:id`: Get specific event by ID
- `GET /metrics`: Aggregate metrics and statistics
- `GET /users/:userId/events`: Get events for specific user

### WebSocket Endpoint
- Real-time event streaming to connected clients
- Subscribe to specific event types or users
- Low-latency updates for dashboards

### Query Features
- Time-range filtering leveraging TimescaleDB hypertable partitioning
- Event type filtering with indexed lookups
- User-specific event retrieval
- JSONB property querying for flexible filtering
- Aggregation queries for analytics dashboards

## Configuration

When implemented, the service will use:
- `API_PORT`: HTTP server port (default: 3001)
- `POSTGRES_URL`: Database connection for queries
- Shared PostgreSQL pool from config module

## Future Implementation

The API service will be built using:
- Express.js for HTTP endpoints
- ws (WebSocket) library for real-time streaming
- PostgreSQL connection pooling for query efficiency
- Input validation using Zod schemas
