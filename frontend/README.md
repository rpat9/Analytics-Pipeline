# Analytics Pipeline Frontend

Real-time analytics dashboard built with React, TypeScript, and Tailwind CSS.

## Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling

## Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## Features

- **Real-time Metrics Dashboard** - Live event tracking with 5-second refresh
- **Summary Cards** - Total events, events/second, unique users, top event type
- **Interactive Area Chart** - Last 5 minutes of activity by event type
- **Recent Events Table** - Latest 20 events with color-coded badges
- **Dark Theme UI** - Glass-morphism cards with gradient accents
- **Responsive Design** - Optimized for desktop and tablet views
- **Auto-refresh** - All sections synchronized at 5-second intervals

## Project Structure

```
frontend/
├── src/
│   ├── App.tsx                      # Main dashboard orchestrator
│   ├── main.tsx                     # Entry point
│   ├── index.css                    # Global styles
│   ├── api/
│   │   └── client.ts                # API client with TypeScript interfaces
│   └── components/
│       ├── SummaryCards.tsx         # Key metrics cards
│       ├── RealtimeChart.tsx        # Area chart with Recharts
│       └── RecentEvents.tsx         # Events table
├── public/                          # Static assets
├── index.html                       # HTML template
└── vite.config.ts                   # Vite configuration
```

## API Integration

The frontend connects to the backend API service running on `http://localhost:3001`.

### Endpoints Used
- `GET /metrics/summary` - Summary metrics (total events, events/sec, unique users, top events)
- `GET /metrics/realtime` - Last 5 minutes of activity in 10-second buckets
- `GET /events/recent?limit=20` - Latest events with full details

### Polling Strategy
- All endpoints polled every 5 seconds for synchronized updates
- API responses cached server-side (5s TTL)
- Error handling with retry mechanism
- Loading states for all components

## Tech Stack Details

- **Recharts** - Area charts with gradient fills and legends
- **date-fns** - Date formatting for timestamps
- **react-icons** - Icon library (Chart, Lightning, Users, Trophy)

## Status

**Complete** - Real-time dashboard fully functional with auto-refresh.