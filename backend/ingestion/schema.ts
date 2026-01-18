import { z } from 'zod';
import { randomUUID } from 'crypto';


// Base event schema that all events share
export const BaseEventSchema = z.object({
    event_id: z.uuidv4(),
    timestamp: z.iso.datetime(),
    event_type: z.enum(['page_view', 'button_click', 'api_call', 'error']),
    user_id: z.string(),
});


// Page view Event
export const PageViewPropertiesSchema = z.object({
    page_url: z.url(),
    referrer: z.url(),
    session_id: z.uuidv4(),
    viewport_width: z.number().int().positive(),
    viewport_height: z.number().int().positive(),
});

export const PageViewEventSchema = BaseEventSchema.extend({
    event_type: z.literal('page_view'),
    properties: PageViewPropertiesSchema,
});


// Button click Event
export const ButtonClickPropertiesSchema = z.object({
    button_id: z.string(),
    button_text: z.string(),
    page_url: z.url(),
    session_id: z.uuidv4(),
    click_x: z.number().int(),
    click_y: z.number().int(),
});

export const ButtonClickEventSchema = BaseEventSchema.extend({
    event_type: z.literal('button_click'),
    properties: ButtonClickPropertiesSchema,
});


// API call Event
export const ApiCallPropertiesSchema= z.object({
    endpoint: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    status_code: z.number().int().min(100).max(599),
    duration_ms: z.number().int().positive(),
    user_agent: z.string(),
});

export const ApiCallEventSchema = BaseEventSchema.extend({
    event_type: z.literal('api_call'),
    properties: ApiCallPropertiesSchema,
});


// Error Event
export const ErrorPropertiesSchema = z.object({
    error_type: z.string(),
    message: z.string(),
    stack_trace: z.string().optional(),
    page_url: z.url(),
    browser: z.string(),
    os: z.string(),
});


export const ErrorEventSchema = BaseEventSchema.extend({
    event_type: z.literal('error'),
    properties: ErrorPropertiesSchema,
});


// Union type for all events
export const AnalyticsEventSchema = z.discriminatedUnion('event_type', [
    PageViewEventSchema,
    ButtonClickEventSchema,
    ApiCallEventSchema,
    ErrorEventSchema,
]);


// TypeScript types derived from schemas
export type BaseEvent = z.infer<typeof BaseEventSchema>;
export type PageViewEvent = z.infer<typeof PageViewEventSchema>;
export type ButtonClickEvent = z.infer<typeof ButtonClickEventSchema>;
export type ApiCallEvent = z.infer<typeof ApiCallEventSchema>;
export type ErrorEvent = z.infer<typeof ErrorEventSchema>;
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;


// Event type distribution weights
export const EVENT_DISTRIBUTION = {
    page_view: 0.70,
    button_click: 0.15,
    api_call: 0.10,
    error: 0.05,
} as const;


// Helper to generate random user from pool
const USER_POOL_SIZE = 100;
export const getRandomUserId = (): string => {
    const userId = Math.floor(Math.random() * USER_POOL_SIZE) + 1;
    return `user_${userId.toString().padStart(3, '0')}`;
};


// Helper to get weighted random event type
export const getRandomEventType = (): AnalyticsEvent['event_type'] => {
    const random = Math.random();

    if (random < EVENT_DISTRIBUTION.page_view) {
        return 'page_view';
    } else if (random < EVENT_DISTRIBUTION.page_view + EVENT_DISTRIBUTION.button_click) {
        return 'button_click';
    } else if (random < EVENT_DISTRIBUTION.page_view + EVENT_DISTRIBUTION.button_click + EVENT_DISTRIBUTION.api_call) {
        return 'api_call';
    } else {
        return 'error';
    }
};