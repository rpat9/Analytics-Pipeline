-- ============================================================================
-- CONTINUOUS AGGREGATES FOR ANALYTICS PIPELINE
-- ============================================================================
-- These materialized views pre-calculate event counts at different time 
-- granularities (minute, hour, day). TimescaleDB automatically maintains 
-- them as new data arrives, providing fast query performance.

-- ----------------------------------------------------------------------------
-- 1. MINUTE-LEVEL AGGREGATION
-- ----------------------------------------------------------------------------
-- Groups events into 1-minute buckets for near-realtime metrics
-- Perfect for: Last hour charts, current activity monitoring

CREATE MATERIALIZED VIEW events_per_minute
WITH (timescaledb.continuous) AS
SELECT 
  time_bucket('1 minute', time) AS bucket,
  event_type,
  COUNT(*) AS event_count
FROM events
GROUP BY bucket, event_type
WITH NO DATA;

-- Refresh policy: Update every 1 minute for recent data
-- start_offset: Look back 1 hour to catch any late-arriving events
-- end_offset: Don't aggregate the current minute (it's still being written)
SELECT add_continuous_aggregate_policy('events_per_minute',
  start_offset => INTERVAL '1 hour',
  end_offset => INTERVAL '1 minute',
  schedule_interval => INTERVAL '1 minute'
);

-- ----------------------------------------------------------------------------
-- 2. HOUR-LEVEL AGGREGATION  
-- ----------------------------------------------------------------------------
-- Groups events into 1-hour buckets for daily/weekly trends
-- Perfect for: Last 24 hours, today vs yesterday comparisons

CREATE MATERIALIZED VIEW events_per_hour
WITH (timescaledb.continuous) AS
SELECT 
  time_bucket('1 hour', time) AS bucket,
  event_type,
  COUNT(*) AS event_count
FROM events
GROUP BY bucket, event_type
WITH NO DATA;

-- Refresh policy: Update every 10 minutes
-- start_offset: Look back 1 day for completeness
-- end_offset: Don't aggregate the current hour
SELECT add_continuous_aggregate_policy('events_per_hour',
  start_offset => INTERVAL '1 day',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '10 minutes'
);

-- ----------------------------------------------------------------------------
-- 3. DAY-LEVEL AGGREGATION
-- ----------------------------------------------------------------------------
-- Groups events into 1-day buckets for historical analysis
-- Perfect for: Month-over-month trends, long-term patterns

CREATE MATERIALIZED VIEW events_per_day
WITH (timescaledb.continuous) AS
SELECT 
  time_bucket('1 day', time) AS bucket,
  event_type,
  COUNT(*) AS event_count
FROM events
GROUP BY bucket, event_type
WITH NO DATA;

-- Refresh policy: Update every 1 hour  
-- start_offset: Look back 7 days for completeness
-- end_offset: Don't aggregate today (it's incomplete)
SELECT add_continuous_aggregate_policy('events_per_day',
  start_offset => INTERVAL '7 days',
  end_offset => INTERVAL '1 day',
  schedule_interval => INTERVAL '1 hour'
);

-- ----------------------------------------------------------------------------
-- VERIFICATION QUERIES
-- ----------------------------------------------------------------------------
-- Run these to verify everything is set up correctly:

-- 1. Check that all three views were created:
-- SELECT view_name, materialization_hypertable_name 
-- FROM timescaledb_information.continuous_aggregates;

-- 2. Check that refresh policies are active:
-- SELECT view_name, schedule_interval, refresh_start, refresh_end
-- FROM timescaledb_information.continuous_aggregate_stats;

-- 3. Sample data from each view:
-- SELECT * FROM events_per_minute ORDER BY bucket DESC LIMIT 10;
-- SELECT * FROM events_per_hour ORDER BY bucket DESC LIMIT 10;  
-- SELECT * FROM events_per_day ORDER BY bucket DESC LIMIT 10;
