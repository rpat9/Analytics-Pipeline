import { randomUUID } from "crypto";
import { AnalyticsEvent, PageViewEvent, ButtonClickEvent, ApiCallEvent, ErrorEvent, getRandomUserId, getRandomEventType } from "./schema";

// Sample data pools for realistic event generation
const PAGES = [
    "https://example.com/",
    "https://example.com/products",
    "https://example.com/about",
    "https://example.com/contact",
    "https://example.com/blog",
    "https://example.com/careers",
    "https://example.com/pricing",
    "https://example.com/docs",
    "https://example.com/dashboard",
];

const REFERRERS = [
    'https://google.com',
    'https://facebook.com',
    'https://twitter.com',
    'https://linkedin.com',
];

const BUTTONS = [
    { id: 'cta-primary', text: 'Get Started' },
    { id: 'nav-products', text: 'Products' },
    { id: 'btn-submit', text: 'Submit' },
    { id: 'btn-cancel', text: 'Cancel' },
    { id: 'btn-buy-now', text: 'Buy Now' },
    { id: 'btn-learn-more', text: 'Learn More' },
];

const API_ENDPOINTS = [
    '/api/users',
    '/api/products',
    '/api/orders',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/analytics/track',
];

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

const STATUS_CODES = [200, 201, 204, 400, 401, 403, 404, 500, 502, 503];

const ERROR_TYPES = [
    'TypeError',
    'ReferenceError',
    'SyntaxError',
    'NetworkError',
    'ValidationError',
];

const BROWSERS = ['Chrome', 'Firefox', 'Safari', 'Edge'];
const OS = ['Windows', 'macOS', 'Linux', 'iOS', 'Android'];

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
];


// Helper functions
const randomElement = <T>(array: readonly T[]): T => {
    if (array.length === 0) {
        throw new Error("Cannot select random element from empty array");
    }
    return array[Math.floor(Math.random() * array.length)]!;
};

const randomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};


// Event Generators
function generatePageViewEvent(): PageViewEvent {
    return {
        event_id: randomUUID(),
        timestamp: new Date().toISOString(),
        event_type: 'page_view',
        user_id: getRandomUserId(),
        properties: {
            page_url: randomElement(PAGES),
            referrer: randomElement(REFERRERS),
            session_id: randomUUID(),
            viewport_width: randomInt(1024, 1920),
            viewport_height: randomInt(768, 1080),
        },
    };
}

function generateButtonClickEvent(): ButtonClickEvent {
    const button = randomElement(BUTTONS);
    return {
        event_id: randomUUID(),
        timestamp: new Date().toISOString(),
        event_type: 'button_click',
        user_id: getRandomUserId(),
        properties: {
            button_id: button.id,
            button_text: button.text,
            page_url: randomElement(PAGES),
            session_id: randomUUID(),
            click_x: randomInt(0, 1920),
            click_y: randomInt(0, 1080),
        },
    };
}

function generateApiCallEvent(): ApiCallEvent {
    return {
        event_id: randomUUID(),
        timestamp: new Date().toISOString(),
        event_type: 'api_call',
        user_id: getRandomUserId(),
        properties: {
            endpoint: randomElement(API_ENDPOINTS),
            method: randomElement(HTTP_METHODS),
            status_code: randomElement(STATUS_CODES),
            duration_ms: randomInt(50, 2000),
            user_agent: randomElement(USER_AGENTS),
        },
    };
}

function generateErrorEvent(): ErrorEvent {
    const errorType = randomElement(ERROR_TYPES);
    return {
        event_id: randomUUID(),
        timestamp: new Date().toISOString(),
        event_type: 'error',
        user_id: getRandomUserId(),
        properties: {
            error_type: errorType,
            message: `${errorType}: Something went wrong`,
            stack_trace: Math.random() > 0.5 
                ? `Error: Something went wrong\n    at Object.<anonymous> (app.js:${randomInt(1, 500)}:${randomInt(1, 80)})`
                : undefined,
            page_url: randomElement(PAGES),
            browser: randomElement(BROWSERS),
            os: randomElement(OS),
        },
    };
}


// Main generator function
export function generateEvent(): AnalyticsEvent {
    const eventType = getRandomEventType();

    switch (eventType) {
        case 'page_view':
            return generatePageViewEvent();
        case 'button_click':
            return generateButtonClickEvent();
        case 'api_call':
            return generateApiCallEvent();
        case 'error':
            return generateErrorEvent();
        default:
            throw new Error(`Unsupported event type: ${eventType}`);
    }
}