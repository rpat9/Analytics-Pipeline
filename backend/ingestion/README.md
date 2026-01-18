# Ingestion Service

The ingestion service generates realistic analytics events and publishes them to Redis Stream for downstream processing.

## Overview

This service simulates a production analytics system by generating events at a configurable rate. It supports multiple event types with realistic data distributions and includes burst mode capabilities for testing system resilience under load spikes.

## Event Types

The service generates four types of analytics events:

- **Page View** (70%) - User page navigation tracking
- **Button Click** (15%) - User interaction tracking
- **API Call** (10%) - Backend API request metrics
- **Error** (5%) - Application error tracking

See [SCHEMA.md](SCHEMA.md) for detailed event structure and validation rules.

## Configuration

Configure the service through environment variables in `backend/.env`:

```env
EVENTS_PER_SECOND=10          # Target event generation rate
BURST_MULTIPLIER=10            # Rate multiplier during burst mode
BURST_INTERVAL_MS=300000       # Time between bursts (5 minutes)
BURST_DURATION_MS=30000        # Burst duration (30 seconds)
```

## Running the Service

Start the ingestion service:

```bash
npm run ingestion
```

The service will:
1. Connect to Redis
2. Begin generating events at the configured rate
3. Log progress every 100 events
4. Activate burst mode every 5 minutes

## Output

The service publishes events to the Redis Stream named `analytics_events`.

Progress logs show:
- Total events published
- Current Redis stream length
- Target vs actual rate
- Error count
- Burst mode status

## Files

- `index.ts` - Main service entry point with rate control and monitoring
- `schema.ts` - Zod schemas and TypeScript types for event validation
- `generator.ts` - Event generation logic with realistic data
- `SCHEMA.md` - Comprehensive event schema documentation

## Monitoring

Verify events are being published:

```bash
# Check stream length
docker exec -it analytics-redis redis-cli XLEN analytics_events

# View first event
docker exec -it analytics-redis redis-cli XRANGE analytics_events - + COUNT 1
```

## Performance

Tested configuration:
- Rate: 10 events/second
- Runtime: 1.5 hours continuous
- Total events: 95,332
- Error rate: 0%
- Memory usage: 53.55 MiB (0.68% of available)

## Event Distribution

Events are generated with weighted probabilities:
- 70% page_view events
- 15% button_click events
- 10% api_call events
- 5% error events

User IDs are randomly selected from a pool of 100 simulated users (user_001 through user_100).
