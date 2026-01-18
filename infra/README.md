# Infrastructure

Docker Compose configuration for local development environment.

## Services

### Redis
- **Image:** `redis:7-alpine`
- **Port:** `6379`
- **Purpose:** Event streaming via Redis Streams
- **Data Persistence:** Volume mounted at `/data`
- **Features:**
  - Append-only file (AOF) enabled for durability
  - Health checks configured
  - Auto-restart enabled

### TimescaleDB
- **Image:** `timescale/timescaledb:latest-pg16`
- **Port:** `5432`
- **Purpose:** Time-series data storage
- **Data Persistence:** Volume mounted at `/var/lib/postgresql/data`
- **Features:**
  - PostgreSQL 16 with TimescaleDB extension
  - Health checks configured
  - Auto-restart enabled

## Credentials

**TimescaleDB:**
```
Database: analytics
User: analytics_user
Password: analytics_pass
```

**Redis:**
```
No authentication required (localhost only)
```

## Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f redis
docker-compose logs -f timescaledb
```

### Check Status
```bash
docker-compose ps
```

### Restart Services
```bash
docker-compose restart
```

### Remove All Data (Fresh Start)
```bash
docker-compose down -v
```
WARNING: This deletes all data in the volumes!

## Connecting to Databases

### Redis CLI
```bash
docker exec -it analytics-redis redis-cli
```

### PostgreSQL CLI
```bash
docker exec -it analytics-timescaledb psql -U analytics_user -d analytics
```

## Database Schema

The TimescaleDB database includes:

### Events Table
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

**Indexes:**
- Composite primary key on `(event_id, time)` for hypertable partitioning
- Index on `(event_type, time)` for filtering by event type
- Index on `(user_id, time)` for user-specific queries
- GIN index on `properties` JSONB column for flexible querying

**Features:**
- Hypertable automatically partitions data by time
- Optimized for time-series queries
- Efficient compression for historical data
- Composite key prevents duplicate events

### Setup Script

The schema is defined in `schema.sql` and can be applied with:
```bash
docker exec -i analytics-timescaledb psql -U analytics_user -d analytics < schema.sql
```

## Data Persistence

Both services use Docker volumes for data persistence:
- `redis-data` - Redis data
- `timescale-data` - PostgreSQL data

Data persists across container restarts but can be removed with `docker-compose down -v`.

## Health Checks

Both containers include health checks:
- **Redis:** Pings every 5 seconds
- **TimescaleDB:** pg_isready check every 10 seconds

Containers won't be marked as "healthy" until checks pass.

## Networking

Services communicate via Docker's default bridge network. The backend services connect to these databases using `localhost` because ports are exposed to the host.

## Production Considerations

**WARNING: This setup is for local development only!**

For production deployment:
- Use managed Redis (e.g., AWS ElastiCache, Azure Cache for Redis)
- Use managed PostgreSQL/TimescaleDB (e.g., Timescale Cloud, AWS RDS)
- Enable authentication and SSL/TLS
- Configure proper backup strategies
- Implement monitoring and alerting
- Use secrets management
- Scale horizontally with replicas
