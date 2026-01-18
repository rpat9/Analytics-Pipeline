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
        const logMessage = {
            timestamp,
            service: this.service,
            level: level.toUpperCase(),
            message,
            ...(data !== undefined && { data }),
        };
        
        const output = JSON.stringify(logMessage);

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