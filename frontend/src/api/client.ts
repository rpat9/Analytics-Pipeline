// API code and TypeScript interfaces
export interface SummaryMetrics {
    last_hour: {
        total_events: number;
        unique_users: number;
        events_per_second: number;
        top_events: Array<{
            type: string;
            count: number;
        }>;
    };
}

export interface RealTimeMetrics {
    timeRange: string;
    buckets: Array<{
        timestamp: string;
        counts: {
            page_view?: number;
            button_click?: number;
            api_call?: number;
            error?: number;
        };
    }>;
    summary: {
        total_events: number;
        eventsPerSecond: number;
    };
}

export interface RecentEvent {
    event_id: string;
    event_type: string;
    user_id: string;
    time: string;
    properties: Record<string, any>;
}

export interface RecentEventsResponse {
    events: RecentEvent[];
    count: number;
    limit: number;
}

// API config
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Generic fetch wrapper with error handling
async function fetchAPI<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json();
}

// API Client Functions
export const api = {
    getSummary: () => fetchAPI<SummaryMetrics>('/metrics/summary'),
    getRealTime: () => fetchAPI<RealTimeMetrics>('/metrics/realtime'),
    getRecentEvents: (limit: number = 20) => fetchAPI<RecentEventsResponse>(`/events/recent?limit=${limit}`),
}