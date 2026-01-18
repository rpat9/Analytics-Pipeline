# Real-Time Analytics Pipeline

## Project Overview
Build a production-grade analytics system that ingests events, processes them in real-time, stores them efficiently, and visualizes metrics on a live dashboard.

**End Goal:** A system that can handle 100,000 events per hour continuously, with a dashboard showing real-time metrics and the ability to query historical data.

## Architecture

![Architecture Diagram](architecture-basic.png)

The system consists of four main components:

1. **Ingestion Service** - Generates and publishes events to Redis Stream
2. **Consumer Service** - Processes events from Redis Stream and stores them in TimescaleDB
3. **API Service** - Provides REST endpoints to query data from TimescaleDB
4. **Frontend** - React-based dashboard for real-time visualization

## Tech Stack

### Backend
- **Runtime:** Node.js with TypeScript
- **Message Queue:** Redis Streams
- **Database:** TimescaleDB (PostgreSQL extension for time-series data)
- **Key Libraries:** Express, ioredis, pg, ws, zod

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript

### Infrastructure
- **Container Management:** Docker & Docker Compose
- **Services:** Redis 7, TimescaleDB (PostgreSQL 16)

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Node.js (v18 or higher)
- npm or yarn

### 1. Start Infrastructure Services
```bash
cd infra
docker-compose up -d
```

This starts:
- Redis on `localhost:6379`
- TimescaleDB on `localhost:5432`

### 2. Set Up Backend
```bash
cd backend
npm install
npm run dev
```

The API service will connect to both databases and confirm successful connections.

### 3. Verify Database Connections
You should see console output confirming:
- ✅ Redis connected successfully
- ✅ PostgreSQL connected successfully

## Project Structure

```
Analytics-Pipeline/
├── backend/           # Node.js/TypeScript backend services
│   ├── api/          # REST API server
│   ├── consumer/     # Event consumer service
│   ├── ingestion/    # Event producer/generator
│   └── shared/       # Shared utilities and config
├── frontend/         # React frontend application
├── infra/            # Docker infrastructure configuration
└── scripts/          # Utility scripts
```

## Development Status

### ✅ Completed
- [x] Docker infrastructure setup (Redis + TimescaleDB)
- [x] Shared backend configuration (env, config, logger)
- [x] Database connection testing
- [x] Project structure and organization

### 🚧 In Progress
- [ ] Event ingestion service
- [ ] Event consumer service
- [ ] REST API endpoints
- [ ] Frontend dashboard

## Useful Commands

```bash
# Docker Management
docker-compose up -d      # Start containers
docker-compose down       # Stop containers
docker ps                 # Check container status

# Backend Development
cd backend
npm run dev              # Run API service with hot reload

# Check Logs
docker logs analytics-redis
docker logs analytics-timescaledb
```

## Database Credentials

**TimescaleDB:**
- Host: `localhost:5432`
- Database: `analytics`
- User: `analytics_user`
- Password: `analytics_pass`

**Redis:**
- URL: `redis://localhost:6379`

## Documentation

- [Backend Documentation](backend/README.md)
- [Frontend Documentation](frontend/README.md)
- [Infrastructure Setup](infra/README.md)

## License

ISC