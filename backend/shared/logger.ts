type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
    service: string;
    level: LogLevel;
    message: string;
    data?: unknown;
}

class Logger {

    private service: string;

    constructor(service: string) {
        this.service = service;
    }

    private log({ level, message, data }: Omit<LogOptions, 'service'>){
        const timestamp = new Date().toISOString();
        
        // Format for better readability
        const timeStr = new Date().toLocaleTimeString();
        const levelStr = level.toUpperCase().padEnd(5);
        const serviceStr = this.service.padEnd(20);
        
        // Pretty print data if it exists
        let dataStr = '';
        if (data !== undefined && typeof data === 'object' && data !== null) {
            const entries = Object.entries(data);
            if (entries.length > 0) {
                dataStr = ' | ' + entries.map(([key, value]) => {
                    if (typeof value === 'number') {
                        return `${key}=${value.toLocaleString()}`;
                    }
                    return `${key}=${value}`;
                }).join(', ');
            }
        }
        
        const output = `[${timeStr}] ${levelStr} ${serviceStr} ${message}${dataStr}`;

        switch (level) {
            case 'error':
                console.error(output);
                break;
            case 'warn':
                console.warn(output);
                break;
            case 'debug':
                console.debug(output);
                break;
            default:
                console.log(output);
        }
    }

    info(message: string, data?: unknown) {
        this.log({ level: 'info', message, data });
    }

    warn(message: string, data?: unknown) {
        this.log({ level: 'warn', message, data });
    }

    error(message: string, data?: unknown) {
        this.log({ level: 'error', message, data });
    }

    debug(message: string, data?: unknown) {
        this.log({ level: 'debug', message, data });
    }

}
export const createLogger = (service: string) => new Logger(service);