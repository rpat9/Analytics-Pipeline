-- Real-Time Analytics Pipeline - Database Schema
-- TimescaleDB optimized schema for event storage

-- Enable TimescaleDB extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Drop existing table if it exists (for clean setup)
DROP TABLE IF EXISTS events CASCADE;

-- Create events table with composite primary key
CREATE TABLE events (
    time TIMESTAMPTZ NOT NULL,
    event_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    user_id TEXT NOT NULL,
    properties JSONB NOT NULL,
    PRIMARY KEY (event_id, time)
);

-- Convert to hypertable (TimescaleDB time-series optimization)
-- Partitions data by time for efficient queries
SELECT create_hypertable('events', 'time');

-- Create indexes for common query patterns
CREATE INDEX idx_events_type_time ON events (event_type, time DESC);
CREATE INDEX idx_events_user_time ON events (user_id, time DESC);
CREATE INDEX idx_events_time ON events (time DESC);

-- Create index on JSONB properties for faster property queries
CREATE INDEX idx_events_properties ON events USING GIN (properties);

-- Display table info
\d events

-- Show hypertable info
SELECT * FROM timescaledb_information.hypertables WHERE hypertable_name = 'events';
