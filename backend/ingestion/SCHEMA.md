# Analytics Event Schema

This document describes the event schema used by the ingestion service.

## Base Event Structure

All events share a common base structure:

```typescript
{
  event_id: string (UUID v7),
  timestamp: string (ISO 8601 DateTime),
  event_type: 'page_view' | 'button_click' | 'api_call' | 'error',
  user_id: string,
  properties: object
}
```

**Base Fields:**
- `event_id`: Unique identifier for the event (UUID v7 format)
- `timestamp`: ISO 8601 datetime string indicating when the event occurred
- `event_type`: Type discriminator for the event
- `user_id`: Identifier for the user who triggered the event
- `properties`: Event-specific data structure

## Event Types

### 1. Page View Event (70% of traffic)

Tracks when a user views a page on the website.

**Schema:**
```typescript
{
  event_type: 'page_view',
  properties: {
    page_url: string (URL),
    referrer: string (URL),
    session_id: string (UUID v7),
    viewport_width: number (positive integer),
    viewport_height: number (positive integer)
  }
}
```

**Sample Pages:**
- Homepage, Products, About, Contact, Blog, Careers, Pricing, Docs, Dashboard

**Sample Referrers:**
- Google, Facebook, Twitter, LinkedIn

**Viewport Range:**
- Width: 1024-1920 pixels
- Height: 768-1080 pixels

---

### 2. Button Click Event (15% of traffic)

Tracks user interactions with buttons and clickable elements.

**Schema:**
```typescript
{
  event_type: 'button_click',
  properties: {
    button_id: string,
    button_text: string,
    page_url: string (URL),
    session_id: string (UUID v7),
    click_x: number (integer),
    click_y: number (integer)
  }
}
```

**Sample Buttons:**
- Get Started (cta-primary)
- Products (nav-products)
- Submit (btn-submit)
- Cancel (btn-cancel)
- Buy Now (btn-buy-now)
- Learn More (btn-learn-more)

**Click Coordinates:**
- X: 0-1920 pixels
- Y: 0-1080 pixels

---

### 3. API Call Event (10% of traffic)

Tracks backend API requests and their performance metrics.

**Schema:**
```typescript
{
  event_type: 'api_call',
  properties: {
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    status_code: number (100-599),
    duration_ms: number (positive integer),
    user_agent: string
  }
}
```

**Sample Endpoints:**
- /api/users
- /api/products
- /api/orders
- /api/auth/login
- /api/auth/logout
- /api/analytics/track

**HTTP Methods:**
- GET, POST, PUT, DELETE, PATCH

**Status Codes:**
- Success: 200, 201, 204
- Client Errors: 400, 401, 403, 404
- Server Errors: 500, 502, 503

**Duration Range:**
- 50-2000 milliseconds

---

### 4. Error Event (5% of traffic)

Tracks application errors and exceptions.

**Schema:**
```typescript
{
  event_type: 'error',
  properties: {
    error_type: string,
    message: string,
    stack_trace: string (optional),
    page_url: string (URL),
    browser: string,
    os: string
  }
}
```

**Error Types:**
- TypeError
- ReferenceError
- SyntaxError
- NetworkError
- ValidationError

**Browsers:**
- Chrome, Firefox, Safari, Edge

**Operating Systems:**
- Windows, macOS, Linux, iOS, Android

**Stack Trace:**
- Present in approximately 50% of error events
- Format: Standard JavaScript error stack trace

---

## Event Distribution

The event generator produces events with the following distribution:

| Event Type     | Percentage | Description                      |
|----------------|------------|----------------------------------|
| page_view      | 70%        | Most common - page navigation    |
| button_click   | 15%        | User interactions                |
| api_call       | 10%        | Backend API requests             |
| error          | 5%         | Application errors               |

This distribution simulates realistic web application traffic patterns.

## User Pool

Events are generated for a pool of 100 simulated users:

- **User ID Format:** `user_XXX` (e.g., `user_001`, `user_042`, `user_100`)
- **Pool Size:** 100 users
- **Selection:** Random selection for each event
- **Range:** user_001 through user_100

This creates realistic patterns where the same users generate multiple events over time.

## Validation

All events are validated using Zod schemas before being published to Redis Stream.

**Validation Ensures:**
- Correct data types for all fields
- Required fields are present
- Valid formats (UUID v7, ISO DateTime, URLs)
- Enum constraints are respected (event types, HTTP methods, etc.)
- Numeric ranges are within bounds (status codes 100-599, positive dimensions)

**Validation Location:**
- Schema definitions: `backend/ingestion/schema.ts`
- Discriminated union type for type-safe event handling
- Runtime validation before Redis publication

## Schema Version

**Version:** 1.0.0  
**Last Updated:** January 18, 2026  
**Status:** Active

## Usage

Import the schemas and types in your code:

```typescript
import {
  AnalyticsEvent,
  AnalyticsEventSchema,
  PageViewEvent,
  ButtonClickEvent,
  ApiCallEvent,
  ErrorEvent,
} from './schema';

// Generate an event
import { generateEvent } from './generator';
const event = generateEvent();

// Validate an event
const validatedEvent = AnalyticsEventSchema.parse(event);
```
